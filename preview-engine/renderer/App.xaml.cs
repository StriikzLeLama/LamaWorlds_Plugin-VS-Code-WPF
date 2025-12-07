using System;
using System.IO;
using System.Text;
using System.Windows;
using Newtonsoft.Json;

namespace Renderer
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            
            // Send ready signal immediately when app starts
            // This happens before the window loads
            try
            {
                var readyResponse = new { type = "ready" };
                var json = JsonConvert.SerializeObject(readyResponse);
                Console.WriteLine(json);
                Console.Out.Flush();
            }
            catch (Exception ex)
            {
                // If we can't send ready, at least log it
                System.Diagnostics.Debug.WriteLine($"[Renderer] Failed to send ready: {ex.Message}");
            }
        }
    }
}

