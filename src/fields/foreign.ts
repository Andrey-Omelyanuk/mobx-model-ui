import { Model, ModelDescriptor, models } from '../model'
import {extendObservable, reaction, action} from 'mobx'


/**
 * Decorator for foreign fields
 */
export function foreign<M extends Model>(foreign_model: any, foreign_id?: string) {
    return function (cls: any, field_name: string) {
        const modelName = cls.modelName ?? cls.constructor.name
        if (!modelName)
            throw new Error('Model name is not defined. Did you forget to declare any id fields?')

        const modelDescription = models.get(modelName)
        if (!modelDescription)
            throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`)

        // if it is empty then try auto detect it (it works only with single id) 
        foreign_id = foreign_id ?? `${field_name}_id`

        modelDescription.relations[field_name] = {
            decorator: (obj: M) => {
                // make observable and set default value
                extendObservable(obj, { [field_name]: undefined })
                // watch on foreign id
                obj.disposers.set(`foreign ${field_name}`, reaction(
                    // watch on foreign cache for foreign object
                    () => {
                        const foreignID = obj[foreign_id] 
                        if (foreignID === undefined) return undefined
                        if (foreignID === '') return undefined
                        if (foreignID === null) return null  // foreign object can be null
                        if (foreignID === 'null') return null  // foreign object can be null
                        return foreign_model.getModelDescriptor().cache.get(foreignID)
                    },
                    // update foreign field
                    action('MO: Foreign - update',
                        (_new, _old) => obj[field_name] = _new 
                    ),
                    {fireImmediately: true}
                ))
            },
            disposers: [],
            settings: { foreign_model, foreign_id }
        } 
    }
}
