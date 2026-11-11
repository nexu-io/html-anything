// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { ExternalFileConflictBanner } from './ExternalFileConflictBanner';
import { StudioHostContext } from '../motion/StudioHost';
import { StudioFileConflictError } from '../utils/studioSaveDiagnostics';
import type { ExternalFileChangeCoordinatorHandle } from '../hooks/useExternalFileChangeCoordinator';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function setup(blocked: ExternalFileChangeCoordinatorHandle['blocked']) {
 const coordinator = { blocked, retry: vi.fn(async () => {}), useExternalFile: vi.fn(async () => {}), keepStudioFile: vi.fn(async () => {}) };
 const host = document.createElement('div'); const root = createRoot(host);
 act(() => root.render(<StudioHostContext.Provider value={{ mvpEditor: true }}><ExternalFileConflictBanner coordinator={coordinator}/></StudioHostContext.Provider>));
 return { host, root, coordinator };
}
it('hides paths and code, confirms version choices and catches rejected recovery actions', async () => {
 const {host,root,coordinator}=setup({status:'conflict',generation:1,payload:{},error:new StudioFileConflictError({filePath:'/private/'+'long'.repeat(100),currentVersion:'v2',currentContent:'<html>external</html>',attemptedContent:'<html>mine</html>'})});
 expect(host.textContent).toContain('The project changed elsewhere');
 expect(host.textContent).not.toMatch(/private|<html>|Review or export/);
 expect(host.querySelector('textarea')).toBeNull();
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
 await act(async()=>host.querySelector('button')!.click()); expect(coordinator.useExternalFile).not.toHaveBeenCalled();
 confirm.mockReturnValue(true);
 coordinator.useExternalFile.mockRejectedValueOnce(new Error('EACCES /private/file.html'));
 await act(async()=>host.querySelector('button')!.click());
 expect(host.textContent).toContain('No permission to save changes.'); expect(host.textContent).not.toContain('/private');
 expect(host.querySelector('button')!.disabled).toBe(false);
 act(()=>root.unmount()); confirm.mockRestore();
});
it('offers no fabricated action when neither a version nor recoverable changes are available',()=>{
 const {host,root}=setup({status:'failed',generation:1,path:'secret.html',payload:{},error:new Error('InternalError /secret'),studioContent:null,recovered:false});
 expect(host.textContent).toBe('Changes were not saved. Saving is paused.'); expect(host.querySelector('button')).toBeNull();
 act(()=>root.unmount());
});
it('only offers retry for a live draft and overwrite for a recovered draft',()=>{
 for(const recovered of [false,true]){
  const {host,root}=setup({status:'failed',generation:1,path:'secret.html',payload:{},error:new Error('offline'),studioContent:'<html>draft</html>',recovered});
  expect(host.textContent?.includes('Retry saving')).toBe(!recovered); expect(host.textContent?.includes('Keep my changes')).toBe(recovered);
  act(()=>root.unmount());
 }
});

it('blocks repeated version selection while a real recovery request is pending', async () => {
 const {host,root,coordinator}=setup({status:'conflict',generation:1,payload:{},error:new StudioFileConflictError({filePath:'index.html',currentVersion:'v2',currentContent:'external',attemptedContent:'mine'})});
 let finish!: () => void;
 coordinator.keepStudioFile.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(true);
 const buttons=host.querySelectorAll('button');
 act(()=>{buttons[1].click();buttons[1].click();});
 expect(coordinator.keepStudioFile).toHaveBeenCalledOnce();
 expect(buttons[0].disabled).toBe(true); expect(buttons[1].disabled).toBe(true);
 await act(async()=>finish()); expect(buttons[1].disabled).toBe(false);
 act(()=>root.unmount()); confirm.mockRestore();
});
