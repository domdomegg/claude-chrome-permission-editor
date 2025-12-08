import {test, expect} from 'vitest';
import {generateTransitions} from './write-permissions';

test('generateTransitions creates all pairs', () => {
	const transitions = generateTransitions(['a.com', 'b.com', 'c.com']);

	expect(transitions).toHaveLength(6);
	expect(transitions).toContainEqual({from: 'a.com', to: 'b.com'});
	expect(transitions).toContainEqual({from: 'b.com', to: 'a.com'});
});

test('generateTransitions handles edge cases', () => {
	expect(generateTransitions([])).toHaveLength(0);
	expect(generateTransitions(['a.com'])).toHaveLength(0);
});
