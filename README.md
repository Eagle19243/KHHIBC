# KHHIBC Parser

## Package Availability

Available via NPM:

```
npm install khhibc
```

Browser:
```
<script type="text/javascript" src="khhibc.min.js"></script>
```

## Example

### CommonJS modules
```
var khhibc = require('../src/index')
var obj = khhibc.decode("+D7681031010700/$$31904281647801")
console.log(obj)
console.log(obj.deviceID())
```

### Browser
```
<script>
    var obj = KHHIBC.decode("+D7681031010700/$$31904281647801")
    console.log(obj)
    console.log(obj.deviceID())
</script>
```
