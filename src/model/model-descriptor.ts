import { Cache } from '../cache'
import { Repository } from '../repository' 
import { ID, TypeDescriptor } from '../types'
import Model from './model'

/**
 * ModelFieldDescriptor is a class that contains all the information about the field.
 */
export class ModelFieldDescriptor<T, F> {
    decorator   : (obj: T) => void
    disposers   : (()=>void)[] = []
    type       ?: TypeDescriptor<F>
    settings   ?: any
}

/**
 * ModelDescriptor is a class that contains all the information about the model.
 */
export class ModelDescriptor<T extends Model> {
    /**
     * Model class
     */
    cls: new (args) => T
    /**
     * Id fields
     */
    id: string
    idFieldDescriptors: ModelFieldDescriptor<T, ID>
    /**
     * Fields is a map of all fields in the model that usually use in repository.
     */ 
    fields: {[field_name: string]: ModelFieldDescriptor<T, any>} = {}
    /**
     * Relations is a map of all relations (foreign, one, many) in the model. 
     * It is derivative and does not come from outside.
     */
    relations : {[field_name: string]: ModelFieldDescriptor<T, any>} = {}

    readonly cache: Cache<T> = new Cache<T>()

    /**
     * Return id value from object. Object can have id field with different name.
     */
    getID(obj: Object): ID {
        return obj[this.id] 
    }

    updateCachedObject(rawObj: Object) : T | undefined {
        const rawObjID = this.getID(rawObj)
        const cachedObj = this.cache.get(rawObjID)
        if (cachedObj) {
            cachedObj.updateFromRaw(rawObj)
            cachedObj.refreshInitData()
            return cachedObj
        } 
        return new this.cls(rawObj)
    }

}
