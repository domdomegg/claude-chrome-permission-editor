import {test, expect} from 'vitest';
import {getChromeDataPath} from './shared';

test('getChromeDataPath returns a path containing Chrome', () => {
	const path = getChromeDataPath();
	expect(path).toContain('Chrome');
});
