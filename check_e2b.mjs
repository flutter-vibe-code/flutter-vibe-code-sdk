import {Sandbox} from '@e2b/code-interpreter';
async function main() {
  const sbx = await Sandbox.connect('il352sq75k69ao4evww52');
  const result = await sbx.commands.run('cat /home/user/app/lib/main.dart');
  console.log(result.stdout);
}
main().catch(console.error);

