import { exec } from 'node:child_process';
import fs from 'fs-extra';
import { Game } from 'csdm/common/types/counter-strike';
import { isWindows } from 'csdm/node/os/is-windows';
import { killCounterStrikeProcesses } from '../kill-counter-strike-processes';
import { getSettings } from 'csdm/node/settings/get-settings';
import { StartCounterStrikeError } from './errors/start-counter-strike-error';
import { abortError, throwIfAborted } from 'csdm/node/errors/abort-error';
import { sleep } from 'csdm/common/sleep';
import { UnsupportedGame } from './errors/unsupported-game';
import { getCounterStrikeExecutablePath } from '../get-counter-strike-executable-path';
import { deleteJsonActionsFile } from '../json-actions-file/delete-json-actions-file';
import { isMac } from 'csdm/node/os/is-mac';
import { assertSteamIsRunning } from './assert-steam-is-running';
import { assertDemoPathIsValid } from './assert-demo-path-is-valid';
import { defineCfgFolderLocation } from './define-cfg-folder-location';
import { GameError } from './errors/game-error';
import { AccessDeniedError } from './errors/access-denied-error';
import { tryStartingDemoThroughWebSocket } from './try-starting-demo-through-web-socket';
import { installCounterStrikeServerPlugin, uninstallCounterStrikeServerPlugin } from './cs-server-plugin';
import { getSteamFolderPath } from '../get-steam-folder-path';
import { glob } from 'csdm/node/filesystem/glob';
import { CounterStrikeExecutableNotFound } from './errors/counter-strike-executable-not-found';
import { isLinux } from 'csdm/node/os/is-linux';

type StartCounterStrikeOptions = {
  demoPath: string;
  game: Game;
  width?: number;
  height?: number;
  fullscreen?: boolean;
  playDemoArgs?: string[];
  uninstallPluginOnExit?: boolean;
  signal?: AbortSignal;
  onGameStart: () => void;
};

function buildUnixCommand(scriptPath: string, args: string, game: Game) {
  if (game === Game.CSGO) {
    return `${scriptPath} --args ${args}`;
  }

  return `${scriptPath} ${args}`;
}

async function buildLinuxCommand(scriptPath: string, args: string, game: Game) {
  const steamFolderPath = await getSteamFolderPath();
  const steamScriptName = game === Game.CS2 ? 'SteamLinuxRuntime_sniper/_v2-entry-point' : 'steam-runtime/run.sh';
  const [runSteamScriptPath] = await glob(`**/${steamScriptName}`, {
    cwd: steamFolderPath,
    absolute: true,
    followSymbolicLinks: false,
  });
  if (!runSteamScriptPath) {
    logger.error(
      `Cannot find the Steam Linux Runtime script "${steamScriptName}" in the Steam folder at ${steamFolderPath}`,
    );
    throw new CounterStrikeExecutableNotFound(game);
  }

  const scriptExists = await fs.pathExists(scriptPath);
  if (!scriptExists) {
    logger.error(`Cannot find the Counter-Strike script "${scriptPath}"`);
    throw new CounterStrikeExecutableNotFound(game);
  }

  const command =
    game === Game.CS2
      ? `"${runSteamScriptPath}" --verb=waitforexitandrun -- "${scriptPath}"`
      : `"${runSteamScriptPath}" "${scriptPath}"`;

  return buildUnixCommand(command, args, game);
}

function buildWindowsCommand(executablePath: string, args: string) {
  return `"${executablePath}" ${args}`;
}

async function buildCommand(executablePath: string, args: string, game: Game) {
  if (isWindows) {
    return buildWindowsCommand(executablePath, args);
  }

  if (isLinux) {
    return buildLinuxCommand(executablePath, args, game);
  }

  return buildUnixCommand(executablePath, args, game);
}

export async function startCounterStrike(options: StartCounterStrikeOptions) {
  const { demoPath, game, signal, playDemoArgs, fullscreen } = options;

  if (game === Game.CS2 && isMac) {
    throw new UnsupportedGame(game);
  }

  await assertSteamIsRunning();
  assertDemoPathIsValid(demoPath, game);

  const playbackStarted = await tryStartingDemoThroughWebSocket(demoPath);
  if (playbackStarted) {
    return;
  }

  const executablePath = await getCounterStrikeExecutablePath(game);
  logger.log('Found CS executable at:', executablePath);
  const settings = await getSettings();
  const {
    width: userWidth,
    height: userHeight,
    fullscreen: userFullscreen,
    launchParameters: userLaunchParameters,
    closeGameAfterHighlights,
  } = settings.playback;

  const launchParameters = [
    '-insecure',
    '-novid',
    '+playdemo',
    `"${demoPath}"`,
  ];
  if (playDemoArgs) {
    launchParameters.push(...playDemoArgs);
  }
  if (userLaunchParameters) {
    launchParameters.push(userLaunchParameters);
  }
  const width = options.width ?? userWidth;
  launchParameters.push('-width', String(width));
  const height = options.height ?? userHeight;
  launchParameters.push('-height', String(height));
  const enableFullscreen = fullscreen ?? userFullscreen;
  launchParameters.push(enableFullscreen ? '-fullscreen' : '-sw');

  const args = launchParameters.join(' ');
  const command = await buildCommand(executablePath, args, game);

  throwIfAborted(signal);
  logger.log('Starting game with command', command);

  options.onGameStart();

  const hasBeenKilled = await killCounterStrikeProcesses();
  const shouldWait = hasBeenKilled && !isWindows;
  if (shouldWait) {
    await sleep(2000);
  }

  await installCounterStrikeServerPlugin(game);
  defineCfgFolderLocation();

  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    const gameProcess = exec(command, { windowsHide: true });
	const chunks: string[] = [];
    gameProcess.stdout?.on('data', (data: string) => {
      chunks.push(data);
    });

    gameProcess.stderr?.on('data', (data: string) => {
      chunks.push(data);
    });

    gameProcess.on('exit', (code) => {
      logger.log('Game process exited with code', code);

      deleteJsonActionsFile(demoPath);
      if (options.uninstallPluginOnExit !== false) {
        uninstallCounterStrikeServerPlugin(game);
      }

      if (signal?.aborted) {
        return reject(abortError);
      }

      const output = chunks.join('\n');
      logger.log('Game output: \n', output);

      const hasRunLongEnough = Date.now() - startTime >= 2000;
      if (code !== 0) {
        if (hasRunLongEnough) {
          return reject(new GameError());
        } else {
          logger.error('An error occurred while starting the game');
          if (output.includes('Access is denied')) {
            return reject(new AccessDeniedError());
          }
          return reject(new StartCounterStrikeError(output));
        }
      }

      return resolve();
    });
  });
}