import { extendObservable, intercept, observe } from 'mobx'
import { ID, TypeDescriptor, NumberDescriptor  } from '../types'
import { Model, ModelDescriptor, models } from '../model'


/**
 * Decorator for id field
 * Only id field can register model in models map,
 * because it invoke before a model decorator.
 */
export function id<M extends Model>(typeDescriptor?: TypeDescriptor<ID>, observable: boolean = true) {
    return (cls: any, fieldName: string) => {
        const modelName = cls.modelName ?? cls.constructor.name
        let modelDescription = models.get(modelName)
        // id field is first decorator that invoke before model and other fields decorators
        // so we need to check if model is already registered and if not then register it
        if (!modelDescription) {
            modelDescription = new ModelDescriptor()
            models.set(modelName, modelDescription)
        }

        if (modelDescription.id)
            throw new Error(`Id field already registered in model "${modelName}"`)
    
        const type = typeDescriptor ? typeDescriptor : new NumberDescriptor()

        modelDescription.id = fieldName
        modelDescription.idFieldDescriptors = {
            decorator: (obj: M) => {
                if (observable) extendObservable(obj, { [fieldName]: obj[fieldName] })
                obj.disposers.set('before changes',
                    intercept(obj as any, fieldName, (change) => {
                        let oldValue = obj[fieldName]
                        if (change.newValue !== undefined && oldValue !== undefined)
                            throw new Error(`You cannot change id field: ${oldValue} to ${change.newValue}`)
                        if (change.newValue === undefined && oldValue !== undefined)
                            modelDescription.cache.eject(obj)
                        return change
                    })
                )
                obj.disposers.set('after changes',
                    observe(obj as any, fieldName, (change) => {
                        if (obj.ID !== undefined)
                            modelDescription.cache.inject(obj)
                    })
                )
            },
            disposers: [],
            type,
            settings: {}
        } 
    }
}
