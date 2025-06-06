import { ObjectInput } from '../ObjectInput'


export function autoResetId(input: ObjectInput<any>) {
    // if value still in options, do nothing
    for (const item of input.options.items) {
        if (item.ID === input.value) {
            // have to set value to trigger reaction
            input.set(input.value)
            return
        }
    }
    // otherwise set first available id or undefined
    input.set(input.options.items[0]?.ID)
}
