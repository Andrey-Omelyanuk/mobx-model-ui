import { makeObservable } from 'mobx'
import Model from './model'
import models from './models'


/**
 * Model decorator.
 * Note: Class decorator has constructor of class as argument.
 */
export default function model(constructor) {
    const modelName = constructor.name

    // check that class extends Model
    if (!(constructor.prototype instanceof Model))
        throw new Error(`Class "${modelName}" should extends Model!`)

    // id fields should register the model into models
    const modelDescriptor = models.get(modelName)
    if (!modelDescriptor)
        throw new Error(`Model "${modelName}" should be registered in models. Did you forget to declare any id?`)

    // the field decorators run first, then the model decorator
    // id decorator creates the model descriptor and registers it in models 
    // so, we cannot catch the case when we try to declare a model with the same name 

    // the new constructor
    let f : any = function (...args) {
        let c : any = class extends constructor { constructor (...args) { super(...args) } }
            c.__proto__ = constructor 

        let obj = new c()
        obj.modelName = modelName
        makeObservable(obj)

        const descriptor = obj.modelDescriptor
        // apply id decorators
        if (descriptor.id === undefined) 
            throw new Error(`Model "${modelName}" should have id field decorator!`)

        descriptor.idFieldDescriptors.decorator(obj, descriptor.id)
        // apply field decorators 
        for(const fieldName in descriptor.fields)
            descriptor.fields[fieldName].decorator(obj, fieldName)
        // apply relations decorators
        for(const fieldName in descriptor.relations)
            descriptor.relations[fieldName].decorator(obj, fieldName)

        if (args[0]) obj.updateFromRaw(args[0])
        obj.refreshInitData()
        return obj
    }
    f.modelName = modelName
    f.__proto__ = constructor 
    f.prototype = constructor.prototype  // copy prototype so intanceof operator still works
    Object.defineProperty(f, 'name', { value: constructor.name })
    modelDescriptor.cls = f
    return f  // return new constructor (will override original)
}
