import { observe, extendObservable, runInAction, reaction, action } from 'mobx'
import { Model, models } from '../model'

/**
 * Decorator for many fields
 */
export function many<M extends Model>(remote_model: any, remote_foreign_id?: string) {
    return function (cls: any, field_name: string) {
        const modelName = cls.modelName ?? cls.constructor.name
        if (!modelName)
            throw new Error('Model name is not defined. Did you forget to declare any id fields?')

        const modelDescription = models.get(modelName)
        if (!modelDescription)
            throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`)

        // if it is empty then try auto detect it (it works only with single id) 
        remote_foreign_id = remote_foreign_id ?? `${modelName.toLowerCase()}_id`

        modelDescription.relations[field_name] = {
            decorator: (obj: M) => {
                extendObservable(obj, { [field_name]: [] })
            },
            disposers: [],
            settings: { remote_model, remote_foreign_id } 
        }

        const remoteModelDescriptor = remote_model.getModelDescriptor()


        const disposer_name = `MO: Many - update - ${modelName}.${field_name}`
        
        // watch for remote object in the cache 
        modelDescription.relations[field_name].disposers.push(
            observe(remoteModelDescriptor.cache.store, (remote_change: any) => {
                let remote_obj
                switch (remote_change.type) {
                    case 'add':
                        remote_obj = remote_change.newValue
                        remote_obj.disposers.set(disposer_name , reaction(
                            () => {
                                return modelDescription.cache.get(remote_obj[remote_foreign_id])
                            },
                            action(disposer_name, (_new, _old) => {
                                if (_old) {
                                    const i = _old[field_name].indexOf(remote_obj)
                                    if (i > -1)
                                        _old[field_name].splice(i, 1)
                                }
                                if (_new) {
                                    const i = _new[field_name].indexOf(remote_obj)
                                    if (i === -1)
                                        _new[field_name].push(remote_obj)
                                } 
                            }),
                            {fireImmediately: true}
                        ))
                        break
                    case 'delete':
                        remote_obj = remote_change.oldValue
                        if (remote_obj.disposers.get(disposer_name)) {
                            remote_obj.disposers.get(disposer_name)()
                            remote_obj.disposers.delete(disposer_name)
                        }
                        let obj = modelDescription.cache.get(remote_obj[remote_foreign_id])
                        if (obj) {
                            const i = obj[field_name].indexOf(remote_obj)
                            if (i > -1)
                                runInAction(() => { obj[field_name].splice(i, 1) })
                        } 
                        break
                }
            })
        )
    }
}
