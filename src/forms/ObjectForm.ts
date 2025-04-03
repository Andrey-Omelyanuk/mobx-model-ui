import { Model } from '../model'
import { Input } from '../inputs/Input' 
import { Form } from './Form'


export class ObjectForm<M extends Model> extends Form {
    constructor(
        public  obj     : M,
                inputs  : {[key: string]: Input<any> },
                submit  : () => Promise<void>,
                cancel ?: (response?) => void
    ) {
        super(inputs, submit, cancel)
    }
}
