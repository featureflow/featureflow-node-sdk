import debug from './debug';

// Contract slug (featureflow-client-sdk-testbed/CONTRACT.md): lowercase [a-z0-9._-],
// max 64 chars. The server sanitises defensively; the SDK validates strictly so a typo
// is a visible warning here rather than a silently mangled tag there.
const APPLICATION_PATTERN = /^[a-z0-9._-]{1,64}$/;

/**
 * Validate the configured application tag. Case is forgiven (lowercased); anything else
 * invalid is dropped with a warning and no X-Featureflow-Application header is sent.
 */
export function sanitiseApplication(raw) {
    if (raw == null || raw === '') {
        return undefined;
    }
    if (typeof raw !== 'string') {
        debug('ignoring application %j — must be a string', raw);
        return undefined;
    }
    const value = raw.trim().toLowerCase();
    if (!APPLICATION_PATTERN.test(value)) {
        debug('ignoring application "%s" — must be lowercase a-z, 0-9, dot, underscore or hyphen, max 64 chars', raw);
        return undefined;
    }
    return value;
}
