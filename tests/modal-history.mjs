import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('scripts/modal-history.js', 'utf8');
const listeners = {};
const stack = [{ state: { router: 'preserved' }, url: '/previous' }, { state: { router: 'preserved' }, url: '/guide?q=kept#section' }];
let index = 1, destination = null;
const tasks = [];
const window = {
  location: { get href() { return stack[index].url; }, assign(url) { destination = url; } },
  addEventListener(type, fn) { listeners[type] = fn; },
  history: {
    get state() { return stack[index].state; },
    pushState(state, _, url) { stack.splice(index + 1); stack.push({ state, url }); index++; },
    replaceState(state, _, url) { stack[index] = { state, url: url ?? stack[index].url }; },
    back() { tasks.push(() => { if (index) { index--; listeners.popstate({ state: this.state }); } }); },
    forward() { tasks.push(() => { if (index < stack.length - 1) { index++; listeners.popstate({ state: this.state }); } }); }
  }
};
vm.runInNewContext(source, { window, document: { addEventListener() {}, documentElement: { classList: { toggle() {} } } }, URL });
const api = window.DestinyModalHistory;
const flush = () => { while (tasks.length) tasks.shift()(); };
let item = null, image = false;
const detail = api.bind('item', name => { item = name; }, () => { item = null; });
const zoom = api.bind('image', () => { image = true; }, () => { image = false; });

detail.open('MATRIX');
detail.open('MATRIX');
assert.equal(index, 2, 'Repeated renders must not add duplicate entries');
assert.equal(window.history.state.router, 'preserved');
window.history.back(); flush();
assert.equal(item, null);
assert.equal(window.location.href, '/guide?q=kept#section');
window.history.forward(); flush();
assert.equal(item, 'MATRIX');
zoom.open();
window.history.back(); flush();
assert.equal(image, false);
assert.equal(item, 'MATRIX', 'Back closes only the top dialog');
detail.close(); detail.close(); flush();
assert.equal(index, 1, 'Repeated close requests cannot navigate away');
for (let count = 0; count < 20; count++) { detail.open('ITEM'); detail.close(); flush(); }
assert.equal(index, 1, 'Open/close cycles leave no extra Back steps');
detail.open('A'); detail.close(); detail.open('B'); flush();
assert.equal(item, 'B');
assert.equal(index, 2, 'Opening during asynchronous Back is queued');
zoom.open(); api.navigate('/recipes'); flush();
assert.equal(destination, '/recipes');
assert.equal(index, 1, 'A dialog link consumes its entries before navigation');
window.history.back(); flush();
assert.equal(window.location.href, '/previous', 'With dialogs closed, Back remains native');
console.log('PASS: dialog Back/Forward, nesting, repeated close, rapid reopen, links, and native page navigation');
