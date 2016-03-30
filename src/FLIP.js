import React from 'react';

// TODO: Make a FLIPGroup component that applies the FLIP method to all of its nested children.

export default class FLIP extends React.Component {
    constructor() {
        super();

        this.state = { isFlipping: false };

        this.elementRef = null;
        this.setRef = (element) => this.elementRef = element;
    }

    componentWillReceiveProps(nextProps) {
        // The FLIP method modifies element.style, so don't let the user set styles on the element.
        if (nextProps.style !== undefined) {
            throw new TypeError('Style attribute not allowed on FLIP elements.');
        }

        // Make sure that the user doesn't try to pass in properties with the
        // CSS hyphenated syntax, since we're using the camelCase syntax of element.style.
        // TODO: Warn user if they try to animate properties that could be
        // handled by transforms, such as top/left/width/height.
        for (let i = 0; i < nextProps.flipProperties.length; i++) {
            const cssProperty = nextProps.flipProperties[i];
            if (cssProperty.indexOf('-') !== -1) {
                throw new TypeError('Must use JavaScript-style camelCase for css properties (e.g. boxShadow instead of box-shadow).');
            }
        }

        // Start the FLIP method when any of the elements classes change.
        if (nextProps.className !== this.props.className) {
            this.setState({ isFlipping: true });

            if (this.elementRef === null) {
                throw new Error('Element reference needed in order to FLIP element.');
            }

            doFLIP({
                element: this.elementRef,
                newClassName: nextProps.className,
                transitionClass: nextProps.transitionClass,
                flipProperties: nextProps.flipProperties,
                onTransitionEnd: () => {
                    this.setState({ isFlipping: false });

                    if (this.props.onTransitionEnd) {
                        this.props.onTransitionEnd();
                    }
                }
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Don't render the children until we have finished animating.
        return !nextState.isFlipping;
    }

    render() {
        // Just render the given component as-is, but get a reference to the
        // element so that we cany modify its styles.
        return React.createElement(
                this.props.component,
                Object.assign({}, this.props, {ref: this.setRef}),
                this.props.children);
    }
}

FLIP.propTypes = {
    component: React.PropTypes.any,
    transitionClass: React.PropTypes.string,
    flipProperties: React.PropTypes.arrayOf(React.PropTypes.string),
    onTransitionEnd: React.PropTypes.func
};
FLIP.defaultProps = {
    component: 'span',
    transitionClass: 'flip-transition',
    flipProperties: ['opacity']
};

function doFLIP({ element, newClassName, transitionClass, flipProperties, onTransitionEnd }) {
    let firstStyles;

    // First - Calculate the bounding box and styles for the initial state.
    const first = element.getBoundingClientRect();

    // Save the initial state of the all of the properties that the user wants to animate.
    if (flipProperties.length > 0) {
        const elementStyles = window.getComputedStyle(element);
        firstStyles = flipProperties.map((cssProperty) => elementStyles[cssProperty]);
    }

    // Last - Immediately go to the new state by applying the new className.
    element.className = newClassName;
    const last = element.getBoundingClientRect();

    // Invert - Calculate the difference between the bounding boxes and styles
    // of new state and the initial state.
    const invertX = first.left - last.left;
    const invertY = first.top - last.top;
    const invertWidth = last.width === 0 ? 1 : first.width / last.width;
    const invertHeight = last.height === 0 ? 1 : first.height / last.height;

    // Force the styles back to the initial state.
    if (firstStyles) {
        flipProperties.forEach((cssProperty, index) => element.style[cssProperty] = firstStyles[index]);
    }

    // Force the bounding box to the intial state  by faking it using CSS
    // transforms, because transforms can be animated much more efficiently.
    // TODO: Allow the user to animate other CSS transforms, such as rotate().
    element.style.transformOrigin = '0 0';
    element.style.transform = `translate(${invertX}px, ${invertY}px) scale(${invertWidth}, ${invertHeight})`;

    // Play - After the styles have taken effect, stop forcing them to the
    // initial state and let them transition back to the new state.
    requestAnimationFrame(() => {
        // For some reason waiting until the next frame doesn't seem to be
        // enough for the style changes to take effect, but the frame after
        // that seems to work. I also tried using setTimeout(..., 1), but that
        // only worked about half the time.
        requestAnimationFrame(() => {
            // Apply the transition class so that the user can set whatever
            // transition style they would like.
            element.className = newClassName + ' ' + transitionClass;

            // Undo the forces styles and let the styles transition back to their normal state.
            if (firstStyles) {
                flipProperties.map((cssProperty) => element.style[cssProperty] = null);
            }

            element.style.transform = null;
        });
    });

    const cleanUp = () => {
        // Remove the transition class.
        element.className = newClassName;

        element.style.transformOrigin = null;

        onTransitionEnd();

        element.removeEventListener('transitionend', cleanUp);
    };

    // TODO: Maybe listen for animationend as well?
    // TODO: Check if the browser doesn't support transitionend and just
    // immediately clean up and end the transition if so.
    element.addEventListener('transitionend', cleanUp);
}
