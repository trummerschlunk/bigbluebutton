import React from 'react';
import Button from '/imports/ui/components/common/button/component';
import Toggle from '/imports/ui/components/common/switch/component';
import LocalesDropdown from '/imports/ui/components/common/locales-dropdown/component';
import { defineMessages, injectIntl } from 'react-intl';
import BaseMenu from '../base/component';
import Styled from './styles';
import VideoService from '/imports/ui/components/video-provider/service';
import WakeLockService from '/imports/ui/components/wake-lock/service';
import { ACTIONS } from '/imports/ui/components/layout/enums';
import { getSettingsSingletonInstance } from '/imports/ui/services/settings';

const MIN_FONTSIZE = 0;

const intlMessages = defineMessages({
  applicationSectionTitle: {
    id: 'app.submenu.application.applicationSectionTitle',
    description: 'Application section title',
  },
  animationsLabel: {
    id: 'app.submenu.application.animationsLabel',
    description: 'animations label',
  },
  audioFilterLabel: {
    id: 'app.submenu.application.audioFilterLabel',
    description: 'audio filters label',
  },
  bbbaLabel: {
    id: 'app.submenu.application.bbbaLabel',
    description: 'bbba label',
  },
  darkThemeLabel: {
    id: 'app.submenu.application.darkThemeLabel',
    description: 'dark mode label',
  },
  fontSizeControlLabel: {
    id: 'app.submenu.application.fontSizeControlLabel',
    description: 'label for font size ontrol',
  },
  increaseFontBtnLabel: {
    id: 'app.submenu.application.increaseFontBtnLabel',
    description: 'label for button to increase font size',
  },
  increaseFontBtnDesc: {
    id: 'app.submenu.application.increaseFontBtnDesc',
    description: 'adds descriptive context to increase font size button',
  },
  decreaseFontBtnLabel: {
    id: 'app.submenu.application.decreaseFontBtnLabel',
    description: 'label for button to reduce font size',
  },
  decreaseFontBtnDesc: {
    id: 'app.submenu.application.decreaseFontBtnDesc',
    description: 'adds descriptive context to decrease font size button',
  },
  languageLabel: {
    id: 'app.submenu.application.languageLabel',
    description: 'displayed label for changing application locale',
  },
  currentValue: {
    id: 'app.submenu.application.currentSize',
    description: 'current value label',
  },
  languageOptionLabel: {
    id: 'app.submenu.application.languageOptionLabel',
    description: 'default change language option when locales are available',
  },
  noLocaleOptionLabel: {
    id: 'app.submenu.application.noLocaleOptionLabel',
    description: 'default change language option when no locales available',
  },
  paginationEnabledLabel: {
    id: 'app.submenu.application.paginationEnabledLabel',
    description: 'enable/disable video pagination',
  },
  wbToolbarsAutoHideLabel: {
    id: 'app.submenu.application.wbToolbarsAutoHideLabel',
    description: 'enable/disable auto hiding of whitebord toolbars',
  },
  wakeLockEnabledLabel: {
    id: 'app.submenu.application.wakeLockEnabledLabel',
    description: 'enable/disable wake lock',
  },
  layoutOptionLabel: {
    id: 'app.submenu.application.layoutOptionLabel',
    description: 'layout options',
  },
  pushLayoutLabel: {
    id: 'app.submenu.application.pushLayoutLabel',
    description: 'push layout togle',
  },
  customLayout: {
    id: 'app.layout.style.custom',
    description: 'label for custom layout style',
  },
  smartLayout: {
    id: 'app.layout.style.smart',
    description: 'label for smart layout style',
  },
  presentationFocusLayout: {
    id: 'app.layout.style.presentationFocus',
    description: 'label for presentationFocus layout style',
  },
  videoFocusLayout: {
    id: 'app.layout.style.videoFocus',
    description: 'label for videoFocus layout style',
  },
  presentationFocusPushLayout: {
    id: 'app.layout.style.presentationFocusPush',
    description: 'label for presentationFocus layout style (push to all)',
  },
  videoFocusPushLayout: {
    id: 'app.layout.style.videoFocusPush',
    description: 'label for videoFocus layout style (push to all)',
  },
  smartPushLayout: {
    id: 'app.layout.style.smartPush',
    description: 'label for smart layout style (push to all)',
  },
  customPushLayout: {
    id: 'app.layout.style.customPush',
    description: 'label for custom layout style (push to all)',
  },
  disableLabel: {
    id: 'app.videoDock.webcamDisableLabelAllCams',
  },
  autoCloseReactionsBarLabel: {
    id: 'app.actionsBar.reactions.autoCloseReactionsBarLabel',
  },
  pushToTalkLabel: {
    id: 'app.submenu.application.pushToTalkLabel',
    description: 'enable/disable audio push-to-talk',
  },
});

class ApplicationMenu extends BaseMenu {
  static setHtmlFontSize(size) {
    document.getElementsByTagName('html')[0].style.fontSize = size;
  }

  constructor(props) {
    super(props);

    this.state = {
      settingsName: 'application',
      settings: props.settings,
      isLargestFontSize: false,
      isSmallestFontSize: false,
      showSelect: false,
      fontSizes: [
        '12px',
        '14px',
        '16px',
        '18px',
        '20px',
      ],
      audioFilterEnabled: ApplicationMenu.isAudioFilterEnabled(props
        .settings.microphoneConstraints),
    };
  }

  componentDidMount() {
    this.setInitialFontSize();
  }

  componentWillUnmount() {
    // fix Warning: Can't perform a React state update on an unmounted component
    this.setState = () => {};
  }

  setInitialFontSize() {
    const { fontSizes } = this.state;
    const clientFont = document.getElementsByTagName('html')[0].style.fontSize;
    const hasFont = fontSizes.includes(clientFont);
    if (!hasFont) {
      fontSizes.push(clientFont);
      fontSizes.sort();
    }
    const fontIndex = fontSizes.indexOf(clientFont);
    this.changeFontSize(clientFont);
    this.setState({
      isSmallestFontSize: fontIndex <= MIN_FONTSIZE,
      isLargestFontSize: fontIndex >= (fontSizes.length - 1),
      fontSizes,
    });
  }

  static isAudioFilterEnabled(_constraints) {
    if (typeof _constraints === 'undefined') return true;

    const _isConstraintEnabled = (constraintValue) => {
      switch (typeof constraintValue) {
        case 'boolean':
          return constraintValue;
        case 'string':
          return constraintValue === 'true';
        case 'object':
          return !!(constraintValue.exact || constraintValue.ideal);
        default:
          return false;
      }
    };

    let isAnyFilterEnabled = true;

    const constraints = _constraints && (typeof _constraints.advanced === 'object')
      ? _constraints.advanced
      : _constraints || {};

    isAnyFilterEnabled = Object.values(constraints).find(
      (constraintValue) => _isConstraintEnabled(constraintValue),
    );

    return isAnyFilterEnabled;
  }

  // Added helpers to read/toggle individual constraints
  static isConstraintEnabledValue(constraintValue) {
    switch (typeof constraintValue) {
      case 'boolean':
        return constraintValue;
      case 'string':
        return constraintValue === 'true';
      case 'object':
        return !!(constraintValue?.exact || constraintValue?.ideal);
      default:
        return false;
    }
  }

  static getConstraintEnabled(constraintsObj, key) {
    if (!constraintsObj || typeof constraintsObj !== 'object') return true;
    if (typeof constraintsObj[key] === 'undefined') return true;
    return ApplicationMenu.isConstraintEnabledValue(constraintsObj[key]);
  }

  handleAudioConstraintChange(constraintKey) {
    const currentConstraints = this.state.settings.microphoneConstraints || {};

    // Read current on/off states
    const agcEnabled = ApplicationMenu.getConstraintEnabled(currentConstraints, 'autoGainControl');
    const ecEnabled = ApplicationMenu.getConstraintEnabled(currentConstraints, 'echoCancellation');
    const nsEnabled = ApplicationMenu.getConstraintEnabled(currentConstraints, 'noiseSuppression');

    // Toggle the requested one
    let newAgc = agcEnabled;
    let newEc = ecEnabled;
    let newNs = nsEnabled;

    switch (constraintKey) {
      case 'autoGainControl':
        newAgc = !agcEnabled;
        break;
      case 'echoCancellation':
        newEc = !ecEnabled;
        break;
      case 'noiseSuppression':
        newNs = !nsEnabled;
        break;
      default:
        break;
    }

    // Write all three back so the constraints object is complete and consistent
    const newConstraints = {
      autoGainControl: newAgc,
      echoCancellation: newEc,
      noiseSuppression: newNs,
    };

    const obj = this.state;
    obj.settings.microphoneConstraints = newConstraints;
    this.handleUpdateSettings(this.state.settingsName, obj.settings);
  }

  handleAudioFilterChange() {
    const _audioFilterEnabled = !ApplicationMenu.isAudioFilterEnabled(this
      .state.settings.microphoneConstraints);
    const _newConstraints = {
      autoGainControl: _audioFilterEnabled,
      echoCancellation: _audioFilterEnabled,
      noiseSuppression: _audioFilterEnabled,
    };

    const obj = this.state;
    obj.settings.microphoneConstraints = _newConstraints;
    this.handleUpdateSettings(this.state.settings, obj.settings);
  }

  handleUpdateFontSize(size) {
    const obj = this.state;
    obj.settings.fontSize = size;
    this.handleUpdateSettings(this.state.settingsName, obj.settings);
  }

  changeFontSize(size) {
    const { layoutContextDispatch } = this.props;
    const obj = this.state;
    obj.settings.fontSize = size;
    this.setState(obj, () => {
      ApplicationMenu.setHtmlFontSize(this.state.settings.fontSize);
      this.handleUpdateFontSize(this.state.settings.fontSize);
    });

    layoutContextDispatch({
      type: ACTIONS.SET_FONT_SIZE,
      value: parseInt(size.slice(0, -2), 10),
    });
  }

  handleIncreaseFontSize() {
    const currentFontSize = this.state.settings.fontSize;
    const availableFontSizes = this.state.fontSizes;
    const maxFontSize = availableFontSizes.length - 1;
    const canIncreaseFontSize = availableFontSizes.indexOf(currentFontSize) < maxFontSize;
    const fs = canIncreaseFontSize ? availableFontSizes.indexOf(currentFontSize) + 1 : maxFontSize;
    this.changeFontSize(availableFontSizes[fs]);
    if (fs === maxFontSize) this.setState({ isLargestFontSize: true });
    this.setState({ isSmallestFontSize: false });
  }

  handleDecreaseFontSize() {
    const currentFontSize = this.state.settings.fontSize;
    const availableFontSizes = this.state.fontSizes;
    const canDecreaseFontSize = availableFontSizes.indexOf(currentFontSize) > MIN_FONTSIZE;
    const fs = canDecreaseFontSize ? availableFontSizes.indexOf(currentFontSize) - 1 : MIN_FONTSIZE;
    this.changeFontSize(availableFontSizes[fs]);
    if (fs === MIN_FONTSIZE) this.setState({ isSmallestFontSize: true });
    this.setState({ isLargestFontSize: false });
  }

  handleSelectChange(fieldname, e) {
    const obj = this.state;
    obj.settings[fieldname] = e.target.value;
    this.handleUpdateSettings('application', obj.settings);
  }

  renderAudioFilters() {
    let audioFilterOption = null;

    const SHOW_AUDIO_FILTERS = (window.meetingClientSettings.public.app
      .showAudioFilters === undefined)
      ? true
      : window.meetingClientSettings.public.app.showAudioFilters;

    if (SHOW_AUDIO_FILTERS) {
      const { intl, showToggleLabel, displaySettingsStatus } = this.props;
      const { settings } = this.state;

      const mc = settings.microphoneConstraints || {};
      const agcEnabled = ApplicationMenu.getConstraintEnabled(mc, 'autoGainControl');
      const ecEnabled = ApplicationMenu.getConstraintEnabled(mc, 'echoCancellation');
      const nsEnabled = ApplicationMenu.getConstraintEnabled(mc, 'noiseSuppression');

      audioFilterOption = (
        <>
          {/* Auto Gain Control */}
          <Styled.Row>
            <Styled.Col aria-hidden="true">
              <Styled.FormElement>
                <Styled.Label>
                  {`${intl.formatMessage(intlMessages.audioFilterLabel)}: Auto Gain Control`}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {displaySettingsStatus(agcEnabled)}
                <Toggle
                  icons={false}
                  defaultChecked={agcEnabled}
                  onChange={() => this.handleAudioConstraintChange('autoGainControl')}
                  ariaLabel={`${intl.formatMessage(intlMessages.audioFilterLabel)} - Auto Gain Control - ${displaySettingsStatus(agcEnabled, true)}`}
                  showToggleLabel={showToggleLabel}
                />
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>

          {/* Echo Cancellation */}
          <Styled.Row>
            <Styled.Col aria-hidden="true">
              <Styled.FormElement>
                <Styled.Label>
                  {`${intl.formatMessage(intlMessages.audioFilterLabel)}: Echo Cancellation`}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {displaySettingsStatus(ecEnabled)}
                <Toggle
                  icons={false}
                  defaultChecked={ecEnabled}
                  onChange={() => this.handleAudioConstraintChange('echoCancellation')}
                  ariaLabel={`${intl.formatMessage(intlMessages.audioFilterLabel)} - Echo Cancellation - ${displaySettingsStatus(ecEnabled, true)}`}
                  showToggleLabel={showToggleLabel}
                />
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>

          {/* Noise Suppression */}
          <Styled.Row>
            <Styled.Col aria-hidden="true">
              <Styled.FormElement>
                <Styled.Label>
                  {`${intl.formatMessage(intlMessages.audioFilterLabel)}: Noise Suppression`}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {displaySettingsStatus(nsEnabled)}
                <Toggle
                  icons={false}
                  defaultChecked={nsEnabled}
                  onChange={() => this.handleAudioConstraintChange('noiseSuppression')}
                  ariaLabel={`${intl.formatMessage(intlMessages.audioFilterLabel)} - Noise Suppression - ${displaySettingsStatus(nsEnabled, true)}`}
                  showToggleLabel={showToggleLabel}
                />
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>
        </>
      );
    }

    return audioFilterOption;
  }

  renderBbba() {
    const { intl, showToggleLabel } = this.props;
    // UI only, toggleable, but no function yet
    const [bbbaEnabled, setBbbaEnabled] = React.useState(false);

    return (
      <Styled.Row>
        <Styled.Col aria-hidden="true">
          <Styled.FormElement>
            <Styled.Label>
              {intl.formatMessage(intlMessages.bbbaLabel)}
            </Styled.Label>
          </Styled.FormElement>
        </Styled.Col>
        <Styled.Col>
          <Styled.FormElementRight>
            <Toggle
              icons={false}
              checked={bbbaEnabled}
              onChange={() => setBbbaEnabled(!bbbaEnabled)}
              ariaLabel={intl.formatMessage(intlMessages.bbbaLabel)}
              showToggleLabel={showToggleLabel}
            />
          </Styled.FormElementRight>
        </Styled.Col>
      </Styled.Row>
    );
  }

  renderPaginationToggle() {
    const { paginationToggleEnabled } = this.props;

    if (!paginationToggleEnabled) return false;

    const { intl, showToggleLabel, displaySettingsStatus } = this.props;
    const { settings } = this.state;

    return (
      <Styled.Row>
        <Styled.Col aria-hidden="true">
          <Styled.FormElement>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <Styled.Label>
              {intl.formatMessage(intlMessages.paginationEnabledLabel)}
            </Styled.Label>
          </Styled.FormElement>
        </Styled.Col>
        <Styled.Col>
          <Styled.FormElementRight>
            {displaySettingsStatus(settings.paginationEnabled)}
            <Toggle
              icons={false}
              defaultChecked={settings.paginationEnabled}
              onChange={() => this.handleToggle('paginationEnabled')}
              ariaLabel={`${intl.formatMessage(intlMessages.paginationEnabledLabel)} - ${displaySettingsStatus(settings.paginationEnabled, true)}`}
              showToggleLabel={showToggleLabel}
            />
          </Styled.FormElementRight>
        </Styled.Col>
      </Styled.Row>
    );
  }

  renderDarkThemeToggle() {
    const { intl, showToggleLabel, displaySettingsStatus } = this.props;
    const { settings } = this.state;

    const isDarkThemeEnabled = window.meetingClientSettings.public.app.darkTheme.enabled;
    if (!isDarkThemeEnabled) return null;

    return (
      <Styled.Row>
        <Styled.Col aria-hidden="true">
          <Styled.FormElement>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <Styled.Label>
              {intl.formatMessage(intlMessages.darkThemeLabel)}
            </Styled.Label>
          </Styled.FormElement>
        </Styled.Col>
        <Styled.Col>
          <Styled.FormElementRight>
            {displaySettingsStatus(settings.darkTheme)}
            <Toggle
              icons={false}
              defaultChecked={settings.darkTheme}
              onChange={() => this.handleToggle('darkTheme')}
              showToggleLabel={showToggleLabel}
              ariaLabel={`${intl.formatMessage(intlMessages.darkThemeLabel)} - ${displaySettingsStatus(settings.darkTheme, true)}`}
              data-test="darkModeToggleBtn"
            />
          </Styled.FormElementRight>
        </Styled.Col>
      </Styled.Row>
    );
  }

  renderWakeLockToggle() {
    if (!WakeLockService.isSupported()) return null;

    const { intl, showToggleLabel, displaySettingsStatus } = this.props;
    const { settings } = this.state;

    return (
      <Styled.Row>
        <Styled.Col>
          <Styled.FormElement>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <Styled.Label>
              {intl.formatMessage(intlMessages.wakeLockEnabledLabel)}
            </Styled.Label>
          </Styled.FormElement>
        </Styled.Col>
        <Styled.Col>
          <Styled.FormElementRight>
            {displaySettingsStatus(settings.wakeLock)}
            <Toggle
              icons={false}
              defaultChecked={settings.wakeLock}
              onChange={() => this.handleToggle('wakeLock')}
              ariaLabel={intl.formatMessage(intlMessages.wakeLockEnabledLabel)}
              showToggleLabel={showToggleLabel}
            />
          </Styled.FormElementRight>
        </Styled.Col>
      </Styled.Row>
    );
  }

  // Best-effort: try to find the current local microphone track
  getLocalMicTrack() {
    try {
      // Prefer an app-level audio manager if present
      if (window?.bbbAudioManager?.getLocalMicTrack) {
        const t = window.bbbAudioManager.getLocalMicTrack();
        if (t) return t;
      }
      if (window?.bbbAudioManager?.getLocalMicStream) {
        const s = window.bbbAudioManager.getLocalMicStream();
        const t = s && s.getAudioTracks && s.getAudioTracks()[0];
        if (t) return t;
      }

      // Common fallbacks used in some BBB setups
      const candidates = [
        window?.voice?.localStream,
        window?.bbb?.audio?.localStream,
        window?.BBB?.webrtc?.microphoneStream,
      ].filter(Boolean);

      for (const s of candidates) {
        const t = s?.getAudioTracks?.()[0];
        if (t) return t;
      }
    } catch (e) {
      // no-op
    }
    return null;
  }

  // Option A: applyConstraints on the live mic track using saved settings
  async applyMicConstraintsOptionA() {
    try {
      const track = this.getLocalMicTrack();
      if (!track || typeof track.applyConstraints !== 'function') return;

      // Prefer the persisted Settings; fall back to local state
      const Settings = getSettingsSingletonInstance();
      const mc = (Settings?.application?.microphoneConstraints)
        || this.state?.settings?.microphoneConstraints
        || {};

      const constraints = {
        autoGainControl: !!mc.autoGainControl,
        echoCancellation: !!mc.echoCancellation,
        noiseSuppression: !!mc.noiseSuppression,
      };

      await track.applyConstraints(constraints);
    } catch (err) {
      // Swallow errors to avoid breaking Save flow; log for diagnostics
      // eslint-disable-next-line no-console
      console.warn('applyConstraints failed (Option A):', err);
    }
  }

  render() {
    const {
      allLocales,
      intl,
      showToggleLabel,
      displaySettingsStatus,
      isReactionsEnabled,
    } = this.props;
    const {
      isLargestFontSize, isSmallestFontSize, settings,
    } = this.state;

    // conversions can be found at http://pxtoem.com
    const pixelPercentage = {
      '12px': '75%',
      // 14px is actually 87.5%, rounding up to show more friendly value
      '14px': '90%',
      '16px': '100%',
      // 18px is actually 112.5%, rounding down to show more friendly value
      '18px': '110%',
      '20px': '125%',
    };

    const ariaValueLabel = intl.formatMessage(intlMessages.currentValue, { size: `${pixelPercentage[settings.fontSize]}` });

    const showSelect = allLocales && allLocales.length > 0;
    const Settings = getSettingsSingletonInstance();
    const animations = Settings?.application?.animations;

    return (
      <div>
        <div>
          <Styled.Title>
            {intl.formatMessage(intlMessages.applicationSectionTitle)}
          </Styled.Title>
        </div>
        <Styled.Form>
          <Styled.Row>
            <Styled.Col aria-hidden="true">
              <Styled.FormElement>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <Styled.Label>
                  {intl.formatMessage(intlMessages.animationsLabel)}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {displaySettingsStatus(settings.animations)}
                <Toggle
                  icons={false}
                  defaultChecked={settings.animations}
                  onChange={() => this.handleToggle('animations')}
                  ariaLabel={`${intl.formatMessage(intlMessages.animationsLabel)} - ${displaySettingsStatus(settings.animations, true)}`}
                  showToggleLabel={showToggleLabel}
                />
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>

          {this.renderAudioFilters()}
          <Styled.Row>
            <Styled.Col aria-hidden="true">
              <Styled.FormElement>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <Styled.Label>
                  {intl.formatMessage(intlMessages.pushToTalkLabel)}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {displaySettingsStatus(settings.pushToTalkEnabled)}
                <Toggle
                  icons={false}
                  defaultChecked={settings.pushToTalkEnabled}
                  onChange={() => this.handleToggle('pushToTalkEnabled')}
                  ariaLabel={`${intl.formatMessage(intlMessages.pushToTalkLabel)} - ${displaySettingsStatus(settings.pushToTalkEnabled, true)}`}
                  showToggleLabel={showToggleLabel}
                />
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>
          {this.renderPaginationToggle()}
          {this.renderDarkThemeToggle()}
          {this.renderWakeLockToggle()}

          <Styled.Row>
            <Styled.Col aria-hidden="true">
              <Styled.FormElement>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <Styled.Label>
                  {intl.formatMessage(intlMessages.wbToolbarsAutoHideLabel)}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {displaySettingsStatus(settings.whiteboardToolbarAutoHide)}
                <Toggle
                  icons={false}
                  defaultChecked={settings.whiteboardToolbarAutoHide}
                  onChange={() => this.handleToggle('whiteboardToolbarAutoHide')}
                  ariaLabel={`${intl.formatMessage(intlMessages.wbToolbarsAutoHideLabel)} - ${displaySettingsStatus(settings.whiteboardToolbarAutoHide, true)}`}
                  showToggleLabel={showToggleLabel}
                />
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>

          <Styled.Row>
            <Styled.Col aria-hidden="true">
              <Styled.FormElement>
                <Styled.Label>
                  {intl.formatMessage(intlMessages.disableLabel)}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {displaySettingsStatus(settings.selfViewDisable)}
                <Toggle
                  icons={false}
                  defaultChecked={settings.selfViewDisable}
                  onChange={() => this.handleToggle('selfViewDisable')}
                  ariaLabel={`${intl.formatMessage(intlMessages.disableLabel)} - ${displaySettingsStatus(settings.selfViewDisable, false)}`}
                  showToggleLabel={showToggleLabel}
                />
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>

          {isReactionsEnabled && (
            <Styled.Row>
              <Styled.Col aria-hidden="true">
                <Styled.FormElement>
                  <Styled.Label>
                    {intl.formatMessage(intlMessages.autoCloseReactionsBarLabel)}
                  </Styled.Label>
                </Styled.FormElement>
              </Styled.Col>
              <Styled.Col>
                <Styled.FormElementRight>
                  {displaySettingsStatus(settings.autoCloseReactionsBar)}
                  <Toggle
                    icons={false}
                    defaultChecked={settings.autoCloseReactionsBar}
                    onChange={() => this.handleToggle('autoCloseReactionsBar')}
                    ariaLabel={`${intl.formatMessage(intlMessages.autoCloseReactionsBarLabel)} - ${displaySettingsStatus(settings.autoCloseReactionsBar, false)}`}
                    showToggleLabel={showToggleLabel}
                  />
                </Styled.FormElementRight>
              </Styled.Col>
            </Styled.Row>
          )}

          <Styled.Row>
            <Styled.Col>
              <Styled.FormElement>
                <Styled.Label aria-hidden>
                  {intl.formatMessage(intlMessages.languageLabel)}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                {showSelect ? (
                  <Styled.LocalesDropdownSelect>
                    <LocalesDropdown
                      allLocales={allLocales}
                      handleChange={(e) => this.handleSelectChange('locale', e)}
                      value={settings.locale}
                      elementId="langSelector"
                      ariaLabel={intl.formatMessage(intlMessages.languageLabel)}
                      selectMessage={intl.formatMessage(intlMessages.languageOptionLabel)}
                    />
                  </Styled.LocalesDropdownSelect>
                ) : (
                  <Styled.SpinnerOverlay animations={animations}>
                    <Styled.Bounce1 animations={animations} />
                    <Styled.Bounce2 animations={animations} />
                    <div />
                  </Styled.SpinnerOverlay>
                )}
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>

          <Styled.Separator />
          <Styled.Row>
            <Styled.Col>
              <Styled.FormElement>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <Styled.Label>
                  {intl.formatMessage(intlMessages.fontSizeControlLabel)}
                </Styled.Label>
              </Styled.FormElement>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementCenter aria-hidden>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <Styled.BoldLabel>
                  {`${pixelPercentage[settings.fontSize]}`}
                </Styled.BoldLabel>
              </Styled.FormElementCenter>
            </Styled.Col>
            <Styled.Col>
              <Styled.FormElementRight>
                <Styled.PullContentRight>
                  <Styled.Col>
                    <Button
                      onClick={() => this.handleDecreaseFontSize()}
                      color="primary"
                      icon="substract"
                      circle
                      hideLabel
                      label={intl.formatMessage(intlMessages.decreaseFontBtnLabel)}
                      aria-label={`${intl.formatMessage(intlMessages.decreaseFontBtnLabel)}, ${ariaValueLabel}`}
                      disabled={isSmallestFontSize}
                      data-test="decreaseFontSize"
                    />
                  </Styled.Col>
                  <Styled.Col>
                    <Button
                      onClick={() => this.handleIncreaseFontSize()}
                      color="primary"
                      icon="add"
                      circle
                      hideLabel
                      label={intl.formatMessage(intlMessages.increaseFontBtnLabel)}
                      aria-label={`${intl.formatMessage(intlMessages.increaseFontBtnLabel)}, ${ariaValueLabel}`}
                      disabled={isLargestFontSize}
                      data-test="increaseFontSize"
                    />
                  </Styled.Col>
                </Styled.PullContentRight>
              </Styled.FormElementRight>
            </Styled.Col>
          </Styled.Row>
        </Styled.Form>
      </div>
    );
  }
}

export default injectIntl(ApplicationMenu);
