import React from 'react';
import PropTypes from 'prop-types';

export default function context(name, type = PropTypes.any.isRequired) {
  return function contextDecorator(Component) {
    function ContextDecorator(props, innerContext) {
      return <Component {...innerContext} {...props} />;
    }

    ContextDecorator.contextTypes = {
      [name]: type,
    };

    return ContextDecorator;
  };
}
