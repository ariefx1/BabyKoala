export const resolveGame = (value: string): string | undefined => {
  switch (value.toLocaleLowerCase()) {
    case 'dota':
    case 'pota':
    case 'dotes':
    case 'dota2':
    case 'dota 2':
    case 'dota-2':
      return 'Dota 2';
    case 'vl':
    case 'vlr':
    case 'val':
    case 'valo':
    case 'valor':
    case 'valorant':
      return 'Valorant';
    case 'cs':
    case 'csgo':
    case 'cs;go':
    case 'cs go':
    case 'cs-go':
    case 'cs: go':
    case 'counter strike':
    case 'counter-strike':
    case 'global offensive':
    case 'global-offensive':
    case 'counter strike go':
    case 'counter-strike-go':
    case 'cs global offensive':
    case 'cs global-offensive':
    case 'cs-global-offensive':
    case 'counter strike global offensive':
    case 'counter-strike-global-offensive':
    case 'counter strike; global offensive':
    case 'counter-strike: global offensive':
      return 'Counter-Strike: Global Offensive';
    case 'ow':
    case 'overwatch':
      return 'Overwatch';
    case 'lol':
    case 'league':
    case 'league of legends':
    case 'league-of-legends':
      return 'League of Legends';
    default: 
      return undefined;
  }
}
