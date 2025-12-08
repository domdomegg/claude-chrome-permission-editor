import {homedir, platform} from 'os';

export function getChromeDataPath(): string {
	const home = homedir();
	const os = platform();

	if (os === 'darwin') {
		return `${home}/Library/Application Support/Google/Chrome`;
	}

	if (os === 'win32') {
		return `${home}/AppData/Local/Google/Chrome/User Data`;
	}

	if (os === 'linux') {
		return `${home}/.config/google-chrome`;
	}

	throw new Error(`Unsupported platform: ${os}`);
}
