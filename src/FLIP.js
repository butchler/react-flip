import React from 'react';

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
            throw new TypeError('Style attribute not allowed on FLIP element.');
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
                flipOpacity: nextProps.flipOpacity,
                onTransitionEnd: () => this.setState({ isFlipping: false })
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Don't render the children until we have finished animating.
        return !nextState.isFlipping;
    }

    render() {
        return React.createElement(
                this.props.component,
                Object.assign({}, this.props, {ref: this.setRef}),
                this.props.children);
    }
}

FLIP.propTypes = {
    component: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.element]),
    transitionClass: React.PropTypes.string,
    flipOpacity: React.PropTypes.bool
};
FLIP.defaultProps = { component: 'span', transitionClass: 'flip-transition', flipOpacity: true };

function doFLIP({ element, newClassName, transitionClass, flipOpacity, onTransitionEnd }) {
    let firstOpacity;

    // First
    const first = element.getBoundingClientRect();
    if (flipOpacity) {
        firstOpacity = window.getComputedStyle(element).opacity;
    }

    // Last
    element.className = newClassName;
    const last = element.getBoundingClientRect();

    // Invert
    const invertX = first.left - last.left;
    const invertY = first.top - last.top;
    const invertWidth = last.width === 0 ? 1 : first.width / last.width;
    const invertHeight = last.height === 0 ? 1 : first.height / last.height;

    // TODO: Support other styles besides transform and opacity.
    element.style.transformOrigin = '0 0';
    element.style.transform = `translate(${invertX}px, ${invertY}px) scale(${invertWidth}, ${invertHeight})`;

    // For convenience also animate the opacity values in the same way.
    if (flipOpacity) {
        element.style.opacity = firstOpacity;
    }

    // Play
    requestAnimationFrame(() => {
        // For some reason waiting until the next frame doesn't seem to be
        // enough for the style changes to take effect, but the frame after
        // that seems to work. I also tried using setTimeout(..., 1), but that
        // only worked about half the time.
        requestAnimationFrame(() => {
            element.className = newClassName + ' ' + transitionClass;

            element.style.transform = null;

            if (flipOpacity) {
                element.style.opacity = null;
            }
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
    element.addEventListener('transitionend', cleanUp);
}
