# @rbzl/svelte-form-control

## Install

``` bash
npm i @rbzl/svelte-form-control
```

## Example usage

``` svelte

<script>
  import {
    Control,
    ControlGroup,
    ControlArray,
    controlClasses,
    controlError
  } from "@rbzl/svelte-form-control";

  import {
    email,
    integer,
    required,
    minLength,
    maxLength,
    min,
    max
  } from "@rbzl/svelte-form-control/validators";

  const form = new ControlGroup({
      name: new Control("tes", [
        required("email required"),
        minLength('min length 4', 4),
        maxLength('max length 10', 10),
        name => name === "test" ? null : 'expected <b>test</b>',
      ]),
      email: new Control("test@inbox", [
        required("email required"),
        email("invalid email")
      ]),
      len: new Control("2", [
        required("number required"),
        integer("invalid number"),
        min('minimum 3', 3),
        max('maximum 20', 20),
      ]),
      test: new ControlArray([
        new Control("init"),
        new Control("init2"),
      ]),
    },
      [
        (value) => {
          const valid =
            value.email && value.email.indexOf('@') >= value.len;
          return valid ? null : `email name part should be at least ${value.len} long`;
        }
      ]);


  const value = form.value;
  const state = form.state;
  $: json = JSON.stringify($value);
</script>

<style global>
  :global(.invalid.touched) {
    border-color: red;
  }
  :global(.valid.touched) {
    border-color: green;
  }
  :global(.dirty) {
    color: inherit;
  }
  :global(.pristine) {
    color: darkgray;
  }
  .error {
    color: red;
  }
</style>


<h1>Hello {$value.name} ({$value.email}; age: {$value.age})!</h1>

<div>{$state.valid ? 'valid' : 'invalid'}</div>
<div>{$state.dirty ? 'dirty' : 'pristine'}</div>
<div>{$state.touched ? 'touched' : 'untouched'}</div>

<div>
  <input bind:value={$value.name} use:controlClasses={form.getControl('name')} />
  <span class="error" use:controlError={form.getControl('name')}></span>
</div>

<div>
  <input bind:value={$value.email} use:controlClasses={form.getControl('email')} />
  <span class="error" use:controlError={form.getControl('email')}></span>
</div>

<div>
  <input bind:value={$value.len} use:controlClasses={form.getControl('len')} />
  <span class="error" use:controlError={form.getControl('len')}></span>
</div>

<div class="error" use:controlError={form}></div>

<div>
  <input bind:value={$value.test[0]} use:controlClasses={form.getControl('test[0]')} />
  <span class="error" use:controlError={form.getControl('test[0]')}></span>
</div>

<div>
  <input bind:value={$value.test[1]} use:controlClasses={form.getControl('test[1]')} />
  <span class="error" use:controlError={form.getControl('test[1]')}></span>
</div>

<div>
  <button disabled={!$state.valid}>submit</button>
  <button on:click={() => form.reset({ test: ['reset1', 'reset2'] })} disabled={!$state.dirty}>
    reset
  </button>
</div>

<pre>{json}</pre>

```
