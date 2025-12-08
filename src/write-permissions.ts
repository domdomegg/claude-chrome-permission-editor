#!/usr/bin/env node

import {ClassicLevel} from 'classic-level';
import {readFileSync, existsSync} from 'fs';
import {randomUUID} from 'crypto';
import {getChromeDataPath} from './shared';

const EXTENSION_ID = 'fcoeoabgfenejglbffodgkkbkcdhcgfn';
const TRANSITIONS_COUNT = 50;

type Permission = {
	id: string;
	scope: {type: 'netloc'; netloc: string} | {type: 'domain_transition'; fromDomain: string; toDomain: string};
	action: 'allow';
	duration: 'always';
	createdAt: number;
};

type PermissionStorage = {
	permissions: Permission[];
};

function getExtensionStoragePath(): string {
	return `${getChromeDataPath()}/Default/Local Extension Settings/${EXTENSION_ID}`;
}

export function generateTransitions(sites: string[]): {from: string; to: string}[] {
	const transitions: {from: string; to: string}[] = [];
	for (const from of sites) {
		for (const to of sites) {
			if (from !== to) {
				transitions.push({from, to});
			}
		}
	}

	return transitions;
}

async function main(): Promise<void> {
	const domainsFile = process.argv[2];

	if (!domainsFile || domainsFile === '--help' || domainsFile === '-h') {
		console.log(`
Usage: node dist/write-permissions.js <domains-file>

Arguments:
  domains-file    Path to text file with one domain per line

Example:
  node dist/write-permissions.js domains.txt
`);
		process.exit(0);
	}

	if (!existsSync(domainsFile)) {
		console.error(`Domains file not found: ${domainsFile}`);
		process.exit(1);
	}

	// Read domains
	const allDomains = readFileSync(domainsFile, 'utf8')
		.split('\n')
		.map((d) => d.trim())
		.filter((d) => d.length > 0 && d.includes('.'));

	console.log(`Loaded ${allDomains.length} domains from ${domainsFile}`);

	const topDomainsForTransitions = allDomains.slice(0, TRANSITIONS_COUNT);

	const dbPath = getExtensionStoragePath();
	console.log(`Extension storage path: ${dbPath}`);

	if (!existsSync(dbPath)) {
		console.error(`\nExtension storage not found at: ${dbPath}`);
		console.error('Make sure Claude for Chrome is installed and has been opened at least once.');
		process.exit(1);
	}

	let db: ClassicLevel | undefined;
	try {
		db = new ClassicLevel(dbPath, {valueEncoding: 'utf8'});
		await db.open();

		// Read current permissions
		let currentStorage: PermissionStorage = {permissions: []};
		try {
			const raw = await db.get('permissionStorage');
			currentStorage = JSON.parse(raw) as PermissionStorage;
		} catch {
			console.log('No existing permissions, starting fresh');
		}

		console.log(`Current permissions: ${currentStorage.permissions.length}`);

		// Add netloc permissions for ALL domains
		let netlocAdded = 0;
		for (const site of allDomains) {
			const exists = currentStorage.permissions.some((p) => p.scope.type === 'netloc' && (p.scope).netloc === site);
			if (!exists) {
				const permission: Permission = {
					id: randomUUID(),
					scope: {type: 'netloc', netloc: site},
					action: 'allow',
					duration: 'always',
					createdAt: Date.now(),
				};
				currentStorage.permissions.push(permission);
				netlocAdded += 1;
			}
		}

		console.log(`Added ${netlocAdded} netloc permissions`);

		// Add domain transition permissions
		const transitions = generateTransitions(topDomainsForTransitions);
		let transitionsAdded = 0;
		for (const {from, to} of transitions) {
			const exists = currentStorage.permissions.some((p) =>
				p.scope.type === 'domain_transition'
				&& (p.scope).fromDomain === from
				&& (p.scope).toDomain === to);
			if (!exists) {
				const permission: Permission = {
					id: randomUUID(),
					scope: {type: 'domain_transition', fromDomain: from, toDomain: to},
					action: 'allow',
					duration: 'always',
					createdAt: Date.now(),
				};
				currentStorage.permissions.push(permission);
				transitionsAdded += 1;
			}
		}

		console.log(`Added ${transitionsAdded} domain transitions`);

		// Write back
		await db.put('permissionStorage', JSON.stringify(currentStorage));

		console.log(`\nTotal permissions now: ${currentStorage.permissions.length}`);
		console.log('Done! Restart Chrome to pick up changes.');
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (message.includes('LOCK') || message.includes('lock')) {
			console.error('\nDatabase is locked. Close Chrome completely and try again.');
		} else {
			console.error('Error:', message);
		}

		process.exit(1);
	} finally {
		if (db) {
			await db.close();
		}
	}
}

if (process.argv[1]?.endsWith('write-permissions.js')) {
	void main();
}
