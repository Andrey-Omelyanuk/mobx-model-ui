import { Model } from '../model'
import { Input } from '../inputs/Input' 
import { Form } from './Form'
import { runInAction } from 'mobx'


export class ObjectForm<M extends Model> extends Form {
    constructor(
        public  obj     : M,
                inputs  : {[key: string]: Input<any> },
                onDone ?: (obj?: M) => void
    ) {
        super(
            inputs,
            async () => {
                const fieldsNames = Object.keys(this.obj)
                // check if all fields from inputs are in obj
                for (let fieldName of Object.keys(this.inputs))
                    if (!fieldsNames.includes(fieldName))
                        throw new Error(`ObjectForm error: object has no field ${fieldName}`)
                // move all values from inputs to obj
                runInAction(()=> {
                    for (let fieldName of Object.keys(inputs))
                        this.obj[fieldName] = inputs[fieldName].value
                })

                await this.obj.save() as M
                onDone && onDone(obj)
            },
            onDone
        )
    }
}
