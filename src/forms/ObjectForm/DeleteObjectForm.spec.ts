import { model, Model, local, NUMBER, id, DeleteObjectForm } from '../..'

describe('DeleteObjectForm', () => {

    @local()
    @model class A extends Model {
        @id(NUMBER()) id: number
        a: string
        b: number
    }

    afterEach(async () => {
        A.getModelDescriptor().cache.clear() 
        jest.clearAllMocks()
    })

    it('apply', (done)=> {
        const onSuccess = jest.fn(() => {})
        const obj = new A()
        const form = new DeleteObjectForm(obj, {}, onSuccess)
        expect(form.isLoading).toBe(false)
        form.submit().finally(() => {
            expect(form.isLoading).toBe(false)
            expect(form.errors).toEqual([])
            expect(onSuccess).toHaveBeenCalledTimes(1)
            done()
        })
        expect(form.isLoading).toBe(true)
    })
})