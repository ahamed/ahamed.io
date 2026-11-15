import { FINALE, STOPS } from '../../content/journey';
import { TextContent } from './TextContent';
import styles from './TextMode.module.css';

/**
 * Inside the voyage: every card as visually hidden HTML for screen readers, behind a skip link
 * that is the page's first focusable element and shows on focus.
 */
export function SkipLink() {
  return (
    <a className={styles.skip} href="#text-version">
      Skip to text version
    </a>
  );
}

export function HiddenContent() {
  return (
    <div className="visually-hidden">
      <h2 id="text-version" tabIndex={-1}>
        Text version
      </h2>
      <TextContent stops={STOPS} finale={FINALE} idPrefix="hidden" tabbable={false} />
    </div>
  );
}
