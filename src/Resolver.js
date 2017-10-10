/* global window */
/* eslint-disable no-underscore-dangle */

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { renderToStaticMarkup } from 'react-dom/server';

const ID = 'ReactResolver.ID';
const CHILDREN = 'ReactResolver.CHILDREN';
const HAS_RESOLVED = 'ReactResolver.HAS_RESOLVED';
const IS_CLIENT = 'ReactResolver.IS_CLIENT';
const PAYLOAD = '__REACT_RESOLVER_PAYLOAD__';

function computeState(thisProps, nextState) {
  const { props, resolve } = thisProps;

  Object.keys(resolve).forEach((name) => {
    // Ignore existing supplied props or existing resolved values
    // eslint-disable-next-line no-prototype-builtins
    if (!nextState.resolved.hasOwnProperty(name)) {
      const factory = resolve[name];
      const value = factory(props);
      const isPromise = (
        value instanceof Promise
        ||
        (
          (
            // eslint-disable-next-line no-mixed-operators
            typeof value === 'object' && value !== null
            // eslint-disable-next-line no-mixed-operators
            ||
            typeof value === 'function'
          )
          &&
          typeof value.then === 'function'
        )
      );

      if (isPromise) {
        // eslint-disable-next-line no-param-reassign
        nextState.pending[name] = value;
      } else {
        // Synchronous values are immediately assigned
        // eslint-disable-next-line no-param-reassign
        nextState.resolved[name] = value;
      }
    }
  });

  return nextState;
}

export default class Resolver extends React.Component {
  static childContextTypes = {
    resolver: PropTypes.instanceOf(Resolver),
  };

  static contextTypes = {
    resolver: PropTypes.instanceOf(Resolver),
  };

  static defaultProps = {
    props: {},
    data: {}, // eslint-disable-line react/default-props-match-prop-types
    resolve: {}, // eslint-disable-line react/default-props-match-prop-types
  };

  static displayName = 'Resolver';

  static propTypes = {
    children: PropTypes.func.isRequired,
    data: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    props: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    onResolve: PropTypes.func, // eslint-disable-line react/require-default-props
  };

  static render = (render, node, data = window[PAYLOAD]) => {
    const element = (
      <Resolver data={data}>
        {render}
      </Resolver>
    );

    (ReactDOM.hydrate || ReactDOM.render)(element, node);
    delete window[PAYLOAD];
  };

  static resolve = (render, initialData = {}) => {
    const queue = [];

    renderToStaticMarkup((
      <Resolver
        data={initialData}
        onResolve={(promise) => {
          queue.push(promise);
          return Promise.resolve(true);
        }}
      >
        {render}
      </Resolver>
    ));

    return Promise.all(queue).then((results) => {
      const data = { ...initialData };

      results.forEach(({ id, resolved }) => {
        data[id] = resolved;
      });

      if (Object.keys(initialData).length < Object.keys(data).length) {
        return Resolver.resolve(render, data);
      }

      function Resolved() {
        return (
          <Resolver data={data}>
            {render}
          </Resolver>
        );
      }

      return { data, Resolved };
    });
  };

  constructor(props, context) {
    super(props, context);

    // Internal tracking variables
    this[ID] = this.generateId();
    this[CHILDREN] = [];
    this[HAS_RESOLVED] = false;
    this[IS_CLIENT] = false;

    this.unmounted = false;

    const resolved = this.cached() || {};

    this.state = computeState(this.props, {
      pending: {},
      resolved,
    });

    if (this.isPending(this.state)) {
      this.resolve(this.state);
      this[HAS_RESOLVED] = false;
    } else {
      this[HAS_RESOLVED] = true;

      if (Object.keys(resolved).length) {
        this.onResolve({
          id: this[ID],
          resolved,
        });
      }
    }
  }

  getChildContext() {
    return { resolver: this };
  }

  componentDidMount() {
    this[IS_CLIENT] = true;
  }

  componentWillReceiveProps(nextProps) {
    const cleanState = {
      pending: {},
      resolved: {},
    };

    const { pending, resolved } = computeState(nextProps, cleanState);

    // Next state will resolve async props again, but update existing sync props
    const nextState = {
      pending,
      resolved: { ...this.state.resolved, ...resolved },
    };

    this.setAtomicState(nextState);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Prevent updating when parent is changing values
    if (this.isParentPending()) {
      return false;
    }

    // Prevent rendering until pending values are resolved
    if (this.isPending(nextState)) {
      this.resolve(nextState);

      return false;
    }

    // Update if we have resolved successfully
    return this[HAS_RESOLVED];
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  onResolve(state) {
    if (this.props.onResolve) {
      return this.props.onResolve(state);
    } else if (this.context.resolver) {
      return this.context.resolver.onResolve(state);
    }
    return state;
  }

  setAtomicState(...args) {
    if (!this.unmounted) this.setState(...args);
  }

  isParentPending() {
    const { resolver } = this.context;

    if (resolver) {
      return resolver.isPending() || resolver.isParentPending();
    }

    return false;
  }

  isPending(state = this.state) {
    return Object.keys(state.pending).length > 0;
  }

  generateId() {
    const { resolver } = this.context;

    if (!resolver) {
      return '.0';
    }

    const id = `${resolver[ID]}.${resolver[CHILDREN].length}`;

    if (resolver && resolver[CHILDREN].indexOf(this) === -1) {
      resolver[CHILDREN].push(this);
    }

    return id;
  }

  // eslint-disable-next-line consistent-return
  cached(resolver = this) {
    const id = resolver[ID];

    // eslint-disable-next-line no-prototype-builtins
    if (this.props.data.hasOwnProperty(id)) {
      return { ...this.props.data[id] };
    } else if (this.context.resolver) {
      return this.context.resolver.cached(resolver);
    }
  }

  // eslint-disable-next-line consistent-return
  clearData(resolver = this) {
    const id = resolver[ID];

    // eslint-disable-next-line no-prototype-builtins
    if (this.props.data.hasOwnProperty(id)) {
      delete this.props.data[id];
    } else if (this.context.resolver) {
      return this.context.resolver.clearData(resolver);
    }
  }

  resolve(state) {
    const pending = Object.keys(state.pending).map((name) => {
      const promise = state.pending[name];
      return { name, promise };
    });

    const promises = pending.map(({ promise }) => promise);

    let resolving = Promise.all(promises).then((values) => {
      const id = this[ID];
      const resolved = values.reduce((result, value, i) => {
        const { name } = pending[i];

        // eslint-disable-next-line no-param-reassign
        result[name] = value;
        return result;
      }, {});

      return { id, resolved };
    });

    // Resolve listeners get the current ID + resolved
    resolving = this.onResolve(resolving);

    // Update current component with new data (on client)
    // eslint-disable-next-line consistent-return
    resolving.then(({ resolved }) => {
      this[HAS_RESOLVED] = true;

      if (!this[IS_CLIENT]) {
        return false;
      }

      const nextState = {
        pending: {},
        resolved: { ...state.resolved, ...resolved },
      };

      this.setAtomicState(nextState);
    });
  }

  render() {
    // Avoid rendering until ready
    if (!this[HAS_RESOLVED]) {
      return false;
    }

    // If render is called again (e.g. hot-reloading), re-resolve
    if (this.isPending(this.state)) {
      this.resolve(this.state);
    }

    // Both those props provided by parent & dynamically resolved
    return this.props.children({
      ...this.props.props,
      ...this.state.resolved,
    });
  }
}
