import { model, Model, local, id, NUMBER } from '..'

describe('QueryXStream', () => {

    @local()
    @model class A extends Model { @id(NUMBER()) id: number }

    afterEach(async () => {
        jest.clearAllMocks()
    })

    it('constructor: default', async ()=> {
    })
})
