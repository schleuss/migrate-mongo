import fnArgs from 'fn-args';
import _ from 'lodash';

export default (func) => {

  const argNames = fnArgs(func);
  const lastArgName = _.last(argNames);

  return [
    'callback',
    'callback_',
    'cb',
    'cb_',
    'next',
    'next_',
    'done',
    'done_'
  ].includes(lastArgName);

};
