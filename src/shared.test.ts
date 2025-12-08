import {test, expect} from 'vitest';
import {getChromeDataPath} from './shared';

test('getChromeDataPath returns a Chrome data path', () => {
	const path = getChromeDataPath();
	expect(path.toLowerCase()).toContain('chrome');
});
