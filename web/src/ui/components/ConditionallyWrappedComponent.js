const ConditionallyWrappedComponent = ({ condition, wrapper, children }) => condition ? wrapper(children) : children

export default ConditionallyWrappedComponent
