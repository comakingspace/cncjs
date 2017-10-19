import includes from 'lodash/includes';
import isNumber from 'lodash/isNumber';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Widget from '../../components/Widget';
import controller from '../../lib/controller';
import ensurePositiveNumber from '../../lib/ensure-positive-number';
import i18n from '../../lib/i18n';
import WidgetConfig from '../WidgetConfig';
import Laser from './Laser';
import {
    // Controller
    GRBL,
    GRBL_MACHINE_STATE_IDLE,
    GRBL_MACHINE_STATE_RUN,
    SMOOTHIE,
    SMOOTHIE_MACHINE_STATE_IDLE,
    SMOOTHIE_MACHINE_STATE_RUN,
    TINYG,
    TINYG_MACHINE_STATE_READY,
    TINYG_MACHINE_STATE_STOP,
    TINYG_MACHINE_STATE_END,
    TINYG_MACHINE_STATE_RUN,
    // Workflow
    WORKFLOW_STATE_RUNNING
} from '../../constants';
import styles from './index.styl';

class LaserWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };
    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);
    state = this.getInitialState();
    actions = {
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = this.state;
            this.setState({
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            });
        },
        toggleMinimized: () => {
            const { minimized } = this.state;
            this.setState({ minimized: !minimized });
        },
        toggleLaserTest: () => {
            const expanded = this.state.panel.laserTest.expanded;

            this.setState({
                panel: {
                    ...this.state.panel,
                    laserTest: {
                        ...this.state.panel.laserTest,
                        expanded: !expanded
                    }
                }
            });
        },
        changeLaserTestPower: (value) => {
            const power = Number(value) || 0;
            this.setState({
                test: {
                    ...this.state.test,
                    power
                }
            });
        },
        changeLaserTestDuration: (event) => {
            const value = event.target.value;
            if (typeof value === 'string' && value.trim() === '') {
                this.setState({
                    test: {
                        ...this.state.test,
                        duration: ''
                    }
                });
            } else {
                this.setState({
                    test: {
                        ...this.state.test,
                        duration: ensurePositiveNumber(value)
                    }
                });
            }
        },
        changeLaserTestMaxS: (event) => {
            const value = event.target.value;
            if (typeof value === 'string' && value.trim() === '') {
                this.setState({
                    test: {
                        ...this.state.test,
                        maxS: ''
                    }
                });
            } else {
                this.setState({
                    test: {
                        ...this.state.test,
                        maxS: ensurePositiveNumber(value)
                    }
                });
            }
        },
        laserTestOn: () => {
            const { power, duration, maxS } = this.state.test;
            controller.command('lasertest:on', power, duration, maxS);
        },
        laserTestOff: () => {
            controller.command('lasertest:off');
        }
    };
    controllerEvents = {
        'connection:open': (options) => {
            const { ident } = options;
            this.setState(state => ({
                connection: {
                    ...state.connection,
                    ident: ident
                }
            }));
        },
        'connection:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'controller:settings': (type, controllerSettings) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    settings: controllerSettings
                }
            }));
        },
        'controller:state': (type, controllerState) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    state: controllerState
                }
            }));
        }
    };

    componentDidMount() {
        this.addControllerEvents();
    }
    componentWillUnmount() {
        this.removeControllerEvents();
    }
    componentDidUpdate(prevProps, prevState) {
        const {
            minimized,
            panel,
            test
        } = this.state;

        this.config.set('minimized', minimized);
        this.config.set('panel.laserTest.expanded', panel.laserTest.expanded);
        if (isNumber(test.power)) {
            this.config.set('test.power', test.power);
        }
        if (isNumber(test.duration)) {
            this.config.set('test.duration', test.duration);
        }
        if (isNumber(test.maxS)) {
            this.config.set('test.maxS', test.maxS);
        }
    }
    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: false,
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state
            },
            connection: {
                ident: controller.connection.ident
            },
            panel: {
                laserTest: {
                    expanded: this.config.get('panel.laserTest.expanded')
                }
            },
            test: {
                power: this.config.get('test.power', 0),
                duration: this.config.get('test.duration', 0),
                maxS: this.config.get('test.maxS', 1000)
            }
        };
    }
    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }
    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }
    canClick() {
        const machineState = controller.getMachineState();
        const state = this.state;

        if (!controller.connection.ident) {
            return false;
        }

        if (controller.type === GRBL && !includes([
            GRBL_MACHINE_STATE_IDLE,
            GRBL_MACHINE_STATE_RUN
        ], machineState)) {
            return false;
        }

        if (controller.type === SMOOTHIE && !includes([
            SMOOTHIE_MACHINE_STATE_IDLE,
            SMOOTHIE_MACHINE_STATE_RUN
        ], machineState)) {
            return false;
        }

        if (controller.type === TINYG && !includes([
            TINYG_MACHINE_STATE_READY,
            TINYG_MACHINE_STATE_STOP,
            TINYG_MACHINE_STATE_END,
            TINYG_MACHINE_STATE_RUN
        ], machineState)) {
            return false;
        }

        if (controller.workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }

        if (!(isNumber(state.test.power) && isNumber(state.test.duration) && isNumber(state.test.maxS))) {
            return false;
        }

        return true;
    }
    render() {
        const { widgetId } = this.props;
        const { minimized, isFullscreen } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const state = {
            ...this.state,
            canClick: this.canClick()
        };
        const actions = {
            ...this.actions
        };

        return (
            <Widget fullscreen={isFullscreen}>
                <Widget.Header>
                    <Widget.Title>
                        <Widget.Sortable className={this.props.sortable.handleClassName}>
                            <i className="fa fa-bars" />
                            <span className="space" />
                        </Widget.Sortable>
                        {isForkedWidget &&
                        <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                        }
                        {i18n._('Laser')}
                    </Widget.Title>
                    <Widget.Controls className={this.props.sortable.filterClassName}>
                        <Widget.Button
                            disabled={isFullscreen}
                            title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                            onClick={actions.toggleMinimized}
                        >
                            <i
                                className={classNames(
                                    'fa',
                                    { 'fa-chevron-up': !minimized },
                                    { 'fa-chevron-down': minimized }
                                )}
                            />
                        </Widget.Button>
                        <Widget.DropdownButton
                            title={i18n._('More')}
                            toggle={<i className="fa fa-ellipsis-v" />}
                            onSelect={(eventKey) => {
                                if (eventKey === 'fullscreen') {
                                    actions.toggleFullscreen();
                                } else if (eventKey === 'fork') {
                                    this.props.onFork();
                                } else if (eventKey === 'remove') {
                                    this.props.onRemove();
                                }
                            }}
                        >
                            <Widget.DropdownMenuItem eventKey="fullscreen">
                                <i
                                    className={classNames(
                                        'fa',
                                        'fa-fw',
                                        { 'fa-expand': !isFullscreen },
                                        { 'fa-compress': isFullscreen }
                                    )}
                                />
                                <span className="space space-sm" />
                                {!isFullscreen ? i18n._('Enter Full Screen') : i18n._('Exit Full Screen')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="fork">
                                <i className="fa fa-fw fa-code-fork" />
                                <span className="space space-sm" />
                                {i18n._('Fork Widget')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="remove">
                                <i className="fa fa-fw fa-times" />
                                <span className="space space-sm" />
                                {i18n._('Remove Widget')}
                            </Widget.DropdownMenuItem>
                        </Widget.DropdownButton>
                    </Widget.Controls>
                </Widget.Header>
                <Widget.Content
                    className={classNames(
                        styles.widgetContent,
                        { [styles.hidden]: minimized }
                    )}
                >
                    <Laser
                        state={state}
                        actions={actions}
                    />
                </Widget.Content>
            </Widget>
        );
    }
}

export default LaserWidget;
