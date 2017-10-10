import React from "react";
import PropTypes from "prop-types";

export default function context(name, type = PropTypes.any.isRequired) {
  return function contextDecorator(Component) {
    class ContextDecorator extends React.Component {
      static contextTypes = {
        [name]: type,
      }

      static displayName = "ContextDecorator"

      render() {
        return <Component {...this.context} {...this.props} />;
      }
    }

    return ContextDecorator;
  };
}
