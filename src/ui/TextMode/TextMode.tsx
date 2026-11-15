import { withBase } from '../../app/withBase';
import { FINALE, STOPS } from '../../content/journey';
import { TextContent } from './TextContent';
import styles from './TextMode.module.css';

/**
 * The whole voyage as a readable page: `?text`, the HUD and boot links, and the fallback when
 * WebGL is missing (then there is no voyage to go back to).
 */
export function TextMode({ webglMissing = false }: { webglMissing?: boolean }) {
  return (
    <div className={styles.page}>
      <div className={styles.top}>
        {webglMissing ? (
          <p className={styles.note} role="note">
            The 3D voyage needs WebGL, which this browser does not offer, so here is the text
            version.
          </p>
        ) : (
          <a href={withBase('')}>Back to the voyage</a>
        )}
      </div>
      <h1>Sajeeb Ahamed</h1>
      <TextContent stops={STOPS} finale={FINALE} />
    </div>
  );
}
