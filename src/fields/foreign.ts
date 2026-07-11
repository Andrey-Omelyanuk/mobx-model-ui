import { Model, models } from '../model'
import {extendObservable, reaction, action} from 'mobx'


/**
 * Decorator for foreign fields
 */
export function foreign<_M extends Model>(foreign_model: any, foreign_id?: string) {
    return function <M extends Model>(cls: M | ((new (...args: any[]) => M) & { modelName?: string }), field_name: string) {
        const modelName = (cls as any).modelName ?? cls.constructor.name
        if (!modelName)
            throw new Error('Model name is not defined. Did you forget to declare any id fields?')

        const modelDescription = models.get(modelName)
        if (!modelDescription)
            throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`)

        // if it is empty then try auto detect it (it works only with single id) 
        // bind to a const so the value stays narrowed to string inside the closures below
        const foreign_id_field = foreign_id ?? `${field_name}_id`

        modelDescription.relations[field_name] = {
            decorator: (obj: any) => {
                // make observable and set default value
                extendObservable(obj, { [field_name]: undefined })
                // watch on foreign id
                obj.disposers.set(`foreign ${field_name}`, reaction(
                    // watch on foreign cache for foreign object
                    () => {
                        const foreignID = obj[foreign_id_field]
                        if (foreignID === undefined) return undefined
                        if (foreignID === '') return undefined
                        if (foreignID === null) return null  // foreign object can be null
                        if (foreignID === 'null') return null  // foreign object can be null
                        return foreign_model.getModelDescriptor().cache.get(foreignID)
                    },
                    // update foreign field
                    action('MO: Foreign - update',
                        (_new: any, _old: any) => obj[field_name] = _new 
                    ),
                    {fireImmediately: true}
                ))
            },
            disposers: [],
            settings: { foreign_model, foreign_id: foreign_id_field }
        } 
    }
}
