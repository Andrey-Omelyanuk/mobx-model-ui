import { field, ILIKE, Variable, Model, id, NUMBER, model, ORDER_BY, STRING, ARRAY, DESC } from '../dist/mobx-model-ui'

/**
 *  Demonstrates reactive inputs for controlling Query parameters.
 *  Main participants:
 *      - Files: file model
 *      - Input: reactive input with URL synchronization
 *  Main scenarios:
 *      - Input controls ILIKE filter on file title
 *      - Input controls ordering and relations list
 */


describe('Other tests: Inputs.', () => {

    @model
    class File extends Model {
        @id(NUMBER()) id: number
        @field(STRING({maxLength: 24, required: true})) title: string
    }

    it('...', async ()=> {
        const input = new Variable(STRING(), { syncURL: 'search', debounce: 400 })
        const filesQuery = File.getQuery({
            filter      : ILIKE('title', input),
            orderBy     : new Variable(ARRAY(ORDER_BY()), {value: [['uploaded_at', DESC]]}),
            relations   : new Variable(ARRAY(STRING())   , {value: ['versions', ]}),
            autoupdate  : false
        })
    })
})
