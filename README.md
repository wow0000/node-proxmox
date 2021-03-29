lib-proxmox
============

Node.js Module to interact with Proxmox VE API. Using callbacks, operations are non blocking.

* 0 Dependencies required.
* Tested on Proxmox-VE 6.3-6

Usage
============
```javascript
function callback(data){
  console.log(data);
}

const px = require('node-proxmox')('hostname', 'username', 'authtype', 'password');
const body = {}
px.get('/nodes/', callback(data));
px.post('/nodes/{node}/storage/{storage}/content/{volume}', body, callback(data));
px.put('/nodes/{node}/dns', body, callback(data));
px.del('/nodes/{node}/storage/{storage}/content/{volume}', callback(data));
```

Ressources
============

* Proxmox API documentation : https://pve.proxmox.com/pve-docs/api-viewer/
* Original fork: https://github.com/alo-is/node-proxmox
