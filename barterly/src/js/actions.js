// Central click/submit/input delegation. Markup declares intent with
// data-action / data-form / data-input; modules register handlers here.
export const actions = {};   // click:  data-action="name"
export const forms = {};     // submit: data-form="name"
export const inputs = {};    // input:  data-input="name"

export function bindActions(root = document) {
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el, e);
  });
  root.addEventListener('submit', e => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    forms[form.dataset.form]?.(form, e);
  });
  root.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    if (el) inputs[el.dataset.input]?.(el, e);
  });
}
