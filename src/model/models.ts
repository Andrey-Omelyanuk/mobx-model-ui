import { ModelDescriptor } from './model-descriptor'

/**
 * Is a map of all registered models in the application. 
 * It's a singleton.
 */
const models = new Map<string, ModelDescriptor<any>>()
export default models
