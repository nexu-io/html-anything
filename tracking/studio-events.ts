import type { Rule } from './core.ts';

function studio<const F extends Record<string, Rule>, const R extends readonly (keyof F & string)[]>(fields: F, required: R) {
  return { producers: ['studio'] as const, fields, required };
}
const measurement = { min: 0, max: 86_400_000 } as const;
const scalar = { min: -86_400_000, max: 86_400_000 } as const;
const ratio = { min: 0, max: 1 } as const;
export const studioErrorNames = ['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError',
  'EvalError', 'AbortError', 'NetworkError', 'TimeoutError', 'ModelContextMissingError', 'NonError', 'unknown', 'OtherError'] as const;
const error = { error_name: studioErrorNames } as const;
const sdk = { family: ['dom', 'timing', 'gsap-animation', 'gsap-keyframe', 'lifecycle'], opCount: 'integer' } as const;
const desktop = { os: ['darwin', 'win32', 'linux', 'macos', 'windows', 'unknown'], app_installed: 'boolean', download_available: 'boolean' } as const;
const audio = { track_kind: ['voice', 'music', 'sfx', 'unknown'] } as const;
// Fixed identifiers from the pinned engine catalog; authored/custom identifiers become "other".
export const audioEffects = ['gain', 'peaking', 'lowshelf', 'highshelf', 'highpass', 'lowpass', 'compressor', 'limiter', 'truepeak', 'gate', 'saturate', 'bitcrush', 'pitchshift', 'delay', 'chorus', 'phaser', 'reverb', 'other'] as const;
export const audioPresets = ['voice-clean', 'voice-broadcast', 'voice-warm', 'rumble-cut', 'room-gate', 'boom-tame', 'harsh-tame', 'telephone', 'radio-am', 'megaphone', 'lofi-tape', 'pa-system', 'intercom', 'doofus-worble', 'chipmunk', 'giant', 'monster', 'room-tight', 'room-natural', 'hall', 'slap-echo', 'dub-throw', 'other'] as const;
export const audioParams = ['gain', 'frequency', 'q', 'poles', 'threshold', 'ratio', 'attack', 'release', 'knee', 'makeup', 'mix', 'limit', 'level_out', 'ceiling', 'lookahead', 'range', 'type', 'output', 'oversample', 'bits', 'samples', 'semitones', 'time', 'feedback', 'delay', 'depth', 'speed', 'in_gain', 'out_gain', 'decay', 'size', 'damping', 'wet', 'dry', 'other'] as const;
export const audioJobs = ['none', 'tame-boominess', 'reduce-mud', 'reduce-boxiness', 'add-clarity', 'soften-harshness', 'other'] as const;
export const audioValueCategories = ['1', '2', 'tanh', 'atan', 'cubic', 'exp', 'alg', 'quintic', 'sin', 'erf', 'hard', '0', 'other'] as const;
const preset = { ...audio, preset: audioPresets } as const;
const effect = { ...audio, effect: audioEffects } as const;
const save = { status_code: 'integer', attempt: 'integer', mutation_type: 'code', source: 'code', ...error } as const;
export const resolverOperations = ['dom-edit', 'setTiming', 'addGsapTween', 'setGsapTween', 'removeGsapTween', 'removeElement', 'addGsapKeyframe', 'removeGsapKeyframe',
  'removeGsapProperty', 'removeAllKeyframes', 'convertToKeyframes', 'replaceWithKeyframes', 'other'] as const;
const resolver = { opLabel: resolverOperations, sessionEmpty: 'boolean', sessionElementCount: 'integer',
  sourceHfIdCount: 'integer', sourceLooseMatchOnly: 'boolean', sourceReadFailed: 'boolean', diskChecked: 'boolean',
  mismatchCount: 'integer', element_not_found_count: 'integer', animation_not_found_count: 'integer',
  value_mismatch_count: 'integer', dispatch_error_count: 'integer', session_empty_count: 'integer', other_mismatch_count: 'integer' } as const;

/** Existing Studio call sites report through the installation-owned transport, never the upstream collector. */
export const studioUsageEvents = {
  session_start: studio({}, []),
  studio_session_start: studio({ has_project: 'boolean' }, ['has_project']),
  preview_first_frame: studio({ duration_ms: measurement, composition_seconds: measurement, clip_count: 'integer', media_clip_count: 'integer', studio_version: 'code' }, ['duration_ms']),
  studio_render_start: studio({ fps: measurement, quality: 'code', format: ['mp4', 'mov', 'webm', 'gif'], resolution: 'code' }, ['fps', 'format']),
  render_start: studio({ fps: measurement, quality: 'code', format: ['mp4', 'mov', 'webm', 'gif'], resolution: 'code' }, ['fps', 'format']),
  studio_timeline_performance: studio({ total_clip_count: 'integer', mounted_clip_count: 'integer', total_row_count: 'integer',
    timeline_dom_node_count: 'integer', viewport_width: 'integer', viewport_height: 'integer', zoom_mode: 'code', scroll_sample_count: 'integer',
    scroll_frame_latency_p95_ms: measurement, scroll_frame_latency_max_ms: measurement, frame_interval_p95_ms: measurement }, ['scroll_sample_count', 'scroll_frame_latency_p95_ms']),
  playback: studio({ action: ['play', 'pause', 'loop_toggle', 'fullscreen_toggle', 'mute_toggle', 'speed_change'], enabled: 'boolean', active: 'boolean', muted: 'boolean', rate: { min: 0.1, max: 16 } }, ['action']),
  feature_used: studio({ feature: ['move', 'resize', 'rotate', 'crop', 'nudge', 'multi_select', 'z_order', 'text_edit', 'motion_path', 'gesture_recording', 'snapping', 'grid', 'grid_spacing', 'snap_to_grid', 'ruler', 'safe_margins'], surface: ['preview'], method: ['drag', 'button', 'keyboard', 'field'] }, ['feature', 'method']),
  toolbar_action: studio({ action: ['undo', 'redo', 'capture_frame', 'get_desktop_app', 'open_in_desktop'], ...desktop }, ['action']),
  navigation: studio({ action: ['back', 'breadcrumb'] }, ['action']),
  panel_toggle: studio({ panel: ['inspector'], collapsed: 'boolean' }, ['panel', 'collapsed']),
  tab_switch: studio({ panel: ['right_panel'], tab: ['layers', 'design', 'renders', 'block-params', 'slideshow', 'variables', 'motionBlur'] }, ['panel', 'tab']),
  keyboard_shortcut: studio({ action: ['tab_compositions', 'tab_assets', 'copy', 'paste', 'cut', 'duplicate', 'undo', 'redo'] }, ['action']),
  group: studio({ action: ['create', 'ungroup', 'drill_in'], count: 'integer' }, ['action']),
  keyframe: studio({ action: ['add', 'convert', 'remove_all', 'reset', 'delete_all', 'remove', 'move_to_playhead', 'retime', 'retime_resize'], property: 'code' }, ['action']),
  design_input: studio({ ui: ['flat', 'classic'], section: 'code', control: 'code', name: 'code' }, ['ui', 'section', 'control', 'name']),
  studio_razor_split: studio({ mode: ['single', 'all'], count: 'integer' }, ['mode', 'count']),
  studio_keyframe_lane_expand: studio({ expanded: 'boolean' }, ['expanded']),
  studio_segment_ease_edit: studio({ action: ['open', 'commit'], ease: 'code' }, ['action']),
  studio_block_param_commit: studio({ tone: ['saved', 'error', 'confirm'] }, ['tone']),
  studio_feedback_shown: studio({ reason: ['render_complete', 'render_failed', 'crash'], source: ['studio'] }, ['reason']),
  studio_feedback_dismissed: studio({ reason: ['render_complete', 'render_failed', 'crash'], via: ['close', 'escape', 'timeout'], had_rating: 'boolean', source: ['studio'] }, ['reason', 'via']),
  studio_feedback_interview_click: studio({ reason: ['render_complete', 'render_failed', 'crash'], source: ['studio'] }, ['reason']),
  studio_feedback: studio({ reason: ['render_complete', 'render_failed', 'crash'], rating: { min: 0, max: 10 }, rating_scale: { min: 10, max: 10 },
    question: ['remove', 'borrow', 'fix', 'detractor', 'failure'], answer_kind: ['preset', 'typed'], has_comment: 'boolean', source: ['studio'] }, ['reason', 'question', 'answer_kind']),
  desktop_cta_eligibility: studio({ eligibility: ['open_in_app', 'download', 'no_app_for_platform'], ...desktop }, ['eligibility']),
  desktop_cta_impression: studio({ eligibility: ['open_in_app', 'download', 'no_app_for_platform'], ...desktop }, ['eligibility']),
  desktop_cta_guide: studio({ step: ['opened', 'closed', 'download_opened', 'install_detected'], ...desktop }, ['step']),
  desktop_cta_outcome: studio({ outcome: ['opened', 'sent_to_download', 'failed'], ...desktop }, ['outcome']),
  unhandled_error: studio({ ...error, lineno: 'integer', colno: 'integer' }, []),
  unhandled_promise_rejection: studio(error, []),
  error_cap_reached: studio({ count: 'integer' }, ['count']),
  rejection_cap_reached: studio({ count: 'integer' }, ['count']),
  composition_asset_error_filtered: studio({ ...error, total_filtered: 'integer' }, ['total_filtered']),
  abort_rejection_filtered: studio({ total_filtered: 'integer' }, ['total_filtered']),
  crash: studio(error, []),
  studio_caption_autosave_failed: studio(error, []),
  save_skipped_unresolvable: studio({ has_target: 'boolean' }, []),
  save_failure: studio(save, []),
  edit_blocked: studio(save, []),
  save_queue_paused: studio({ source: ['dom_edit'], status_code: 'integer', consecutive_failures: 'integer' }, ['source']),
  file_tree_refresh_failed: studio(error, []),
  commit_invariant_violation: studio({ delta_x: scalar, delta_y: scalar, delta_w: scalar, delta_h: scalar, mutation_count: 'integer', reload_count: 'integer', duration_ms: measurement }, ['mutation_count']),
  commit_transaction: studio({ mutation_count: 'integer', reload_count: 'integer', duration_ms: measurement, pixel_asserted: 'boolean' }, ['mutation_count']),
  commit_transaction_failed: studio({ mutation_count: 'integer', restore_ran: 'boolean', ...error }, ['mutation_count']),
  studio_selection_publish_failed: studio(error, []),
  project_hash_validated: studio({ stage: ['mount', 'hashchange'], outcome: ['ok', 'missing', 'unknown'], status: 'integer' }, ['outcome']),
  cache_key_non_string: studio({ value_type: ['undefined', 'object', 'boolean', 'number', 'bigint', 'string', 'symbol', 'function'], is_array: 'boolean' }, ['value_type']),
  gsap_soft_reload_outcome: studio({ origin: ['preview_sync', 'sdk_refresh'], result: ['cannot-soft-reload', 'verify-failed', 'applied'], escalated: 'boolean' }, ['result']),
  gsap_instant_patch_fallback: studio({}, []),
  sdk_resolver_shadow: studio(resolver, ['mismatchCount']),
  sdk_resolver_shadow_attempt: studio({ attempt_count: 'integer', operation_count: 'integer' }, ['attempt_count', 'operation_count']),
  sdk_cutover_success: studio(sdk, []),
  sdk_cutover_declined: studio({ ...sdk, reason: 'code', resolverDisagreement: 'boolean' }, ['reason']),
  sdk_cutover_failed: studio({ ...sdk, error_kind: ['network', 'conflict', 'http', 'sdk'], status: 'integer' }, ['error_kind']),
  sdk_cutover_refresh_failed: studio(error, []),
  sdk_cutover_publish_failed: studio(error, []),
  sdk_session_unavailable: studio({ stage: ['read', 'open'], reason: ['unsafe_path', 'http_error', 'missing_content', 'absent_or_empty', 'absent', 'empty_file', 'invalid_json', 'network'], status: 'integer', elapsed_ms: measurement, hidden: 'boolean', path_in_tree: 'boolean', ...error }, ['stage']),
  sdk_session_dispose_failed: studio(error, []),
  sdk_session_superseded: studio({}, []),
  'webmcp.polyfill_failed': studio(error, []),
  'webmcp.polyfill_loaded': studio({}, []),
  'webmcp.native_present': studio({}, []),
  webmcp_registration_failed: studio({ ...error, tool_name: 'code' }, []),
  audio_fx_preset_applied: studio({ ...preset, family: ['voice', 'repair', 'character', 'space', 'other'], node_count: 'integer', mode: ['append', 'replace', 'reapply'] }, ['preset', 'mode']),
  audio_fx_preset_removed: studio(preset, ['preset']),
  audio_fx_preset_amount: studio({ ...preset, amount: ratio }, ['preset', 'amount']),
  audio_fx_preset_automated: studio({ ...preset, enabled: 'boolean' }, ['preset', 'enabled']),
  audio_fx_preset_auditioned: studio(preset, ['preset']),
  audio_fx_node_added: studio({ ...effect, via: ['job', 'effect', 'eq', 'leveller'], job: audioJobs }, ['effect', 'via']),
  audio_fx_node_removed: studio({ ...effect, origin: ['preset', 'carve', 'eq', 'leveller', 'hand'] }, ['effect', 'origin']),
  audio_fx_node_bypassed: studio({ ...effect, bypassed: 'boolean' }, ['effect', 'bypassed']),
  audio_fx_node_moved: studio({ ...effect, direction: ['up', 'down'] }, ['effect', 'direction']),
  audio_fx_param_committed: studio({ ...effect, param: audioParams, value: scalar, surface: ['knob', 'details'], value_kind: ['number', 'category'], value_category: audioValueCategories }, ['effect', 'param', 'surface']),
  audio_fx_profile_committed: studio({ ...effect, strength: ratio }, ['effect', 'strength']),
  audio_fx_carve_changed: studio({ action: ['enabled', 'disabled', 'strength', 'sources'], strength: ratio, source_count: 'integer' }, ['action']),
  audio_fx_leveller: studio({ action: ['run', 'removed', 'auditioned'] }, ['action']),
  audio_fx_eq_changed: studio({ band: 'code', value: scalar }, ['band', 'value']),
  audio_fx_chain_observed: studio({ ...audio, node_count: 'integer', nodes_from_preset: 'integer', nodes_from_carve: 'integer', nodes_from_eq: 'integer', nodes_from_leveller: 'integer', nodes_by_hand: 'integer', preset_count: 'integer', bypassed_count: 'integer', first_sight: 'boolean', panel_edits: 'integer', authored_outside: 'boolean', has_carve: 'boolean', has_automation: 'boolean' }, ['node_count', 'authored_outside']),
} as const;
