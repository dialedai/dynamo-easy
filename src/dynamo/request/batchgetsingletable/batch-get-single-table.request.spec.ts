import * as DynamoDB from 'aws-sdk/clients/dynamodb'
// tslint:disable:no-unnecessary-class
// tslint:disable:no-unused-expression
// tslint:disable:no-non-null-assertion
import { resetDynamoEasyConfig } from '../../../../test/helper/resetDynamoEasyConfig.function'
import { SimpleWithCompositePartitionKeyModel, SimpleWithPartitionKeyModel } from '../../../../test/models'
import { updateDynamoEasyConfig } from '../../../config/update-config.function'
import { getTableName } from '../../get-table-name.function'
import { BatchGetSingleTableRequest } from './batch-get-single-table.request'

describe('batch get', () => {
  describe('constructor', () => {
    it('should throw too many items are provided', () => {
      const keys: SimpleWithPartitionKeyModel[] = new Array(200).map((_, ix) => ({ id: `id-${ix}`, age: ix }))
      expect(() => new BatchGetSingleTableRequest(<any>null, SimpleWithPartitionKeyModel, keys)).toThrow()
    })

    it('should throw when adding a key without partition key', () => {
      expect(() => {
        new BatchGetSingleTableRequest(<any>null, SimpleWithPartitionKeyModel, [{}])
      }).toThrow()
      expect(() => {
        new BatchGetSingleTableRequest(<any>null, SimpleWithPartitionKeyModel, [<any>undefined])
      }).toThrow()
    })

    it('should throw when sort key is missing', () => {
      expect(() => {
        new BatchGetSingleTableRequest(<any>null, SimpleWithCompositePartitionKeyModel, [{ id: 'aKey' }])
      }).toThrow()
    })
  })

  describe('correct params', () => {
    it('simple primary key', () => {
      const request = new BatchGetSingleTableRequest<any>(<any>null, SimpleWithPartitionKeyModel, [
        { id: 'myId' },
        { id: 'myId2' },
      ])
      expect(request.params.RequestItems).toBeDefined()
      expect(request.params.RequestItems).toEqual({
        [getTableName(SimpleWithPartitionKeyModel)]: { Keys: [{ id: { S: 'myId' } }, { id: { S: 'myId2' } }] },
      })
    })

    it('composite primary key', () => {
      const key: Partial<SimpleWithCompositePartitionKeyModel> = { id: 'myId', creationDate: new Date() }
      const request = new BatchGetSingleTableRequest<any>(<any>null, SimpleWithCompositePartitionKeyModel, [key])

      expect(request.params.RequestItems).toBeDefined()
      expect(request.params.RequestItems).toEqual({
        [getTableName(SimpleWithCompositePartitionKeyModel)]: {
          Keys: [
            {
              id: { S: key.id },
              creationDate: { S: `${key.creationDate!.toISOString()}` },
            },
          ],
        },
      })
    })

    it('consistent read', () => {
      const request = new BatchGetSingleTableRequest<any>(<any>null, SimpleWithPartitionKeyModel, [{ id: 'myId' }])
      request.consistentRead()
      expect(request.params.RequestItems).toBeDefined()
      expect(request.params.RequestItems[getTableName(SimpleWithPartitionKeyModel)]).toBeDefined()
      expect(request.params.RequestItems[getTableName(SimpleWithPartitionKeyModel)].ConsistentRead).toBeTruthy()
    })

    it('projection expression', () => {
      const request = new BatchGetSingleTableRequest<any>(<any>null, SimpleWithPartitionKeyModel, [{ id: 'myId' }])
      request.projectionExpression('age')
      expect(request.params.RequestItems).toBeDefined()
      const params = request.params.RequestItems[getTableName(SimpleWithPartitionKeyModel)]
      expect(params).toBeDefined()
      expect(params.ProjectionExpression).toBe('#age')
      expect(params.ExpressionAttributeNames).toEqual({
        '#age': 'age',
      })
    })
  })

  describe('should return appropriate value', () => {
    let batchGetItemsSpy: jasmine.Spy
    let req: BatchGetSingleTableRequest<SimpleWithPartitionKeyModel>

    const jsItem: SimpleWithPartitionKeyModel = { id: 'myId', age: 20 }
    const sampleResponse: DynamoDB.BatchGetItemOutput = {
      Responses: {
        [getTableName(SimpleWithPartitionKeyModel)]: [{ id: { S: `${jsItem.id}` }, age: { N: `${jsItem.age}` } }],
      },
    }

    beforeEach(() => {
      batchGetItemsSpy = jasmine.createSpy().and.returnValue(Promise.resolve(sampleResponse))
      req = new BatchGetSingleTableRequest(<any>{ batchGetItems: batchGetItemsSpy }, SimpleWithPartitionKeyModel, [
        jsItem,
      ])
    })

    it('execNoMap', async () => {
      const result = await req.execNoMap()
      expect(result).toBeDefined()
      expect(result).toEqual(sampleResponse)
    })
    it('execFullResponse', async () => {
      const result = await req.execFullResponse()
      expect(result).toBeDefined()
      expect(result.Items).toBeDefined()
      expect(result.Items).toEqual([jsItem])
    })
    it('exec', async () => {
      const result = await req.exec()
      expect(result).toEqual([jsItem])
    })
  })

  describe('logger', () => {
    let logReceiverSpy: jasmine.Spy
    let batchGetItemsSpy: jasmine.Spy
    let req: BatchGetSingleTableRequest<SimpleWithPartitionKeyModel>

    const sampleResponse = { Responses: null }

    beforeEach(() => {
      logReceiverSpy = jasmine.createSpy()
      batchGetItemsSpy = jasmine.createSpy().and.returnValue(Promise.resolve(sampleResponse))
      updateDynamoEasyConfig({ logReceiver: logReceiverSpy })
      req = new BatchGetSingleTableRequest(<any>{ batchGetItems: batchGetItemsSpy }, SimpleWithPartitionKeyModel, [])
    })

    afterEach(resetDynamoEasyConfig)

    it('execNoMap should log params and response', async () => {
      await req.execNoMap()
      expect(logReceiverSpy).toHaveBeenCalled()
      const logInfoData = logReceiverSpy.calls.allArgs().map((i) => i[0].data)
      expect(logInfoData.includes(req.params)).toBeTruthy()
      expect(logInfoData.includes(sampleResponse)).toBeTruthy()
    })

    it('execFullResponse should log params and response', async () => {
      await req.execFullResponse()
      expect(logReceiverSpy).toHaveBeenCalled()
      const logInfoData = logReceiverSpy.calls.allArgs().map((i) => i[0].data)
      expect(logInfoData.includes(req.params)).toBeTruthy()
      expect(logInfoData.includes(sampleResponse)).toBeTruthy()
    })

    it('exec should log params and response', async () => {
      await req.exec()
      expect(logReceiverSpy).toHaveBeenCalled()
      const logInfoData = logReceiverSpy.calls.allArgs().map((i) => i[0].data)
      expect(logInfoData.includes(req.params)).toBeTruthy()
      expect(logInfoData.includes(sampleResponse)).toBeTruthy()
    })
  })
})
