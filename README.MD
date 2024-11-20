# rbxts-transform-dev

A debugging transformer for roblox-ts. Contains helper functions for debugging roblox-ts code with debug information attached.

## How to use
import types
```ts
/// <reference types="rbxts-transform-dev" />
```

relpace print or warn with $debug or $print or $warn
```ts
$debug(instance)
$print(instance)
$warn(instance)
throw 'error message'
```

lua output
```lua
print('[test.ts:1:1] instance =', instance);
print('[test.ts:1:1]', instance);
warn('[test.ts:1:1]', instance);
error('[test.ts:1:1] error message');
```

## Macros

### $debug

test.ts

```ts
$debug(instance);
```

output

```lua
print(`[test.ts:1:1] instance =`, instance);
```

### $print

test.ts

```ts
$print(1, 2, 3);
```

output

```lua
print('[test.ts:1:1]', 1, 2, 3);
```

### $warn

test.ts

```ts
$warn(1, 2, 3);
```

output

```lua
warn('[test.ts:1:1]', 1, 2, 3);
```

### throw

test.ts

```ts
throw "error";
const msg = "test error";
throw msg;
```

output

```lua
error('[test.ts:1:1] error');
local msg = 'test error';
error('[test.ts:3:1] ' .. msg);
```
