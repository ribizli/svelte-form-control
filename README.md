# @rbzl/svelte-form-control

Inspired by Angular's reactive forms but made it 'the Svelte way'.

## Install

**Note**: the package is not yet published to NPM, install it from github directly

``` bash
npm i github:ribizli/svelte-form-control#publish
```

## Example usage

See `example` app in the repo.

Short usage example:

``` svelte

<script>
  import {
    Control,
    ControlGroup,
    ControlArray,
    controlClasses,
    email,
    integer,
    required,
    minLength,
    maxLength,
    min,
    max,
  } from '@rbzl/svelte-form-control';

  import { ControlError } from '@rbzl/svelte-form-control/components';

  const form = new ControlGroup({
    name: new Control('test', [
      required,
      minLength(4),
      maxLength(10),
      name => name === 'test' ? null : { expected: 'test' },
    ]),
    email: new Control('test@inbox.com', [
      required,
      email,
    ]),
    address: new ControlGroup({
      line: new Control('line', [
        required,
      ]),
      city: new Control('ciry', [
        required,
      ]),
      zip: new Control(11111, [
        required,
        integer,
        minLength(5),
        maxLength(5),

      ]),
    }),
    labels: new ControlArray([
      new Control('label1', [required]),
      new Control('label1', [required]),
    ]),
  });

  const value = form.value;
  const state = form.state;

  $: json = JSON.stringify($value, undefined, 2);
  $: stateJson = JSON.stringify($state, undefined, 2);
</script>

<style>
label .label {
  display: block;
}

fieldset {
  border: none;
  margin-top: 1em;
}
</style>

<h1>Svelte form control example</h1>

<div>Form is {$state.$valid ? 'valid' : 'invalid'}</div>
<div>Values are {$state.$dirty ? 'dirty' : 'pristine'}</div>
<div>Fields are {$state.$touched ? 'touched' : 'untouched'}</div>

<label>
  <span class="label">name:</span>
  <input bind:value={$value.name} use:controlClasses={form.child('name')} />
  <ControlError control={form.child('name')}/>
</label>

<label>
  <span class="label">email:</span>
  <input bind:value={$value.email} use:controlClasses={form.child('email')} />
  <ControlError control={form.child('email')}/>
</label>

<fieldset>
  <legend>address:</legend>
  <label>
    <input bind:value={$value.address.line} use:controlClasses={form.child('address.line')} />
    <ControlError control={form.child('address.line')}/>
  </label>

  <label>
    <span class="label">city:</span>
    <input bind:value={$value.address.city} use:controlClasses={form.child('address.city')} />
    <ControlError control={form.child('address.city')}/>
  </label>

  <label>
    <span class="label">zip:</span>
    <input type="number" bind:value={$value.address.zip} use:controlClasses={form.child('address.zip')} />
    <ControlError control={form.child('address.zip')}/>
  </label>
</fieldset>

<fieldset>
  <legend>labels</legend>
  {#each $labels as label, index (label)}
    <div class="">
      <input bind:value={$value.labels[index]} use:controlClasses={label} />
      <ControlError control={label}/>
    </div>
  {/each}
</fieldset>

<div>
  <button on:click={() => form.reset($value)} disabled={!$state.$valid || !$state.$dirty}>submit</button>
  <button on:click={() => form.reset({ labels: ['reset1', 'reset2'] })} disabled={!$state.$dirty}>
    reset
  </button>
</div>

<pre>{json}</pre>
<pre>{stateJson}</pre>

```
