#!/usr/bin/env node

import {execSync} from 'child_process';
import {existsSync} from 'fs';
import {getChromeDataPath} from './shared';

function getChromeHistoryPath(): string {
	return `${getChromeDataPath()}/Default/History`;
}

function filterDomains(domains: string[]): string[] {
	return domains
		.map((d) => d.trim())
		.filter((domain) => {
			if (!domain?.includes('.')) {
				return false;
			}

			if (domain.startsWith('localhost')) {
				return false;
			}

			if (domain.includes('.local:') || domain.includes('.ts.net') || domain.includes('svc.')) {
				return false;
			}

			if (/^[a-z]{32}$/.test(domain)) {
				return false;
			}

			return true;
		});
}

function main(): void {
	const historyPath = getChromeHistoryPath();

	if (!existsSync(historyPath)) {
		console.error(`Chrome history not found at: ${historyPath}`);
		console.error('Make sure Chrome is installed and you have browsing history.');
		process.exit(1);
	}

	// Query to extract domains, ordered by visit count
	const query = `
    SELECT DISTINCT
      SUBSTR(url, INSTR(url, '://') + 3, INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') - 1) as domain,
      COUNT(*) as visits
    FROM urls
    GROUP BY domain
    ORDER BY visits DESC
    LIMIT 600
  `;

	try {
		const result = execSync(`sqlite3 "${historyPath}" "${query}"`, {encoding: 'utf8'});

		const rawDomains = result
			.split('\n')
			.map((line) => line.split('|')[0])
			.filter((d): d is string => d !== undefined);

		const domains = filterDomains(rawDomains);

		console.log(domains.join('\n'));
		console.error(`\nExtracted ${domains.length} domains`);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (message.includes('database is locked')) {
			console.error('Chrome history database is locked. Close Chrome and try again.');
		} else {
			console.error('Error reading Chrome history:', message);
		}

		process.exit(1);
	}
}

main();
