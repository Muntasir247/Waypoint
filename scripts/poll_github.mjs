async function poll() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('https://api.github.com/repos/Muntasir247/Waypoint/commits/08329d7/check-runs', {
        headers: { 'User-Agent': 'node' }
      });
      const data = await res.json();
      const run = data.check_runs?.[0];
      console.log(`[Attempt ${i + 1}] Status: ${run?.status}, Conclusion: ${run?.conclusion}`);
      if (run?.status === 'completed') {
        console.log('Finished with conclusion:', run.conclusion);
        return;
      }
    } catch (e) {
      console.error(e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}
poll();
