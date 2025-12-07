using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Newtonsoft.Json;

namespace Renderer
{
    public partial class RendererWindow : Window
    {
        private const int PORT = 0; // Use stdin/stdout for communication
        private bool _isRunning = true;

        public RendererWindow()
        {
            InitializeComponent();
            
            // Make window invisible (headless mode)
            this.WindowState = WindowState.Minimized;
            this.ShowInTaskbar = false;
            this.Width = 1;
            this.Height = 1;
            this.Visibility = Visibility.Hidden;
            
            this.Loaded += RendererWindow_Loaded;
        }

        private async void RendererWindow_Loaded(object sender, RoutedEventArgs e)
        {
            // Ready signal is already sent in App.OnStartup
            // But send it again here as backup
            try
            {
                SendResponse(new RendererResponse { Type = "ready" });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Renderer] Failed to send ready in Loaded: {ex.Message}");
            }
            
            await StartListeningAsync();
        }

        private async Task StartListeningAsync()
        {
            // Read from stdin in a background thread
            await Task.Run(async () =>
            {
                try
                {
                    using (var reader = new StreamReader(Console.OpenStandardInput(), Encoding.UTF8))
                    {
                        while (_isRunning)
                        {
                            try
                            {
                                var line = await reader.ReadLineAsync();
                                if (string.IsNullOrEmpty(line))
                                {
                                    await Task.Delay(100);
                                    continue;
                                }

                                System.Diagnostics.Debug.WriteLine($"[Renderer] Received message: {line.Substring(0, Math.Min(100, line.Length))}...");

                                // Parse JSON message
                                var message = JsonConvert.DeserializeObject<RendererMessage>(line);
                                if (message != null)
                                {
                                    System.Diagnostics.Debug.WriteLine($"[Renderer] Parsed message type: {message.Type}");
                                    
                                    // Process on UI thread
                                    await Dispatcher.InvokeAsync(() => 
                                    {
                                        try
                                        {
                                            ProcessMessage(message);
                                        }
                                        catch (Exception ex)
                                        {
                                            System.Diagnostics.Debug.WriteLine($"[Renderer] Error in ProcessMessage: {ex.Message}\n{ex.StackTrace}");
                                            SendError($"ProcessMessage error: {ex.Message}");
                                        }
                                    });
                                }
                                else
                                {
                                    System.Diagnostics.Debug.WriteLine("[Renderer] Failed to parse message");
                                    SendError("Failed to parse message");
                                }
                            }
                            catch (Exception ex)
                            {
                                System.Diagnostics.Debug.WriteLine($"[Renderer] Exception in read loop: {ex.Message}\n{ex.StackTrace}");
                                SendError($"Read error: {ex.Message}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Renderer] Fatal error in StartListeningAsync: {ex.Message}\n{ex.StackTrace}");
                    SendError($"Fatal error: {ex.Message}");
                }
            });
        }

        private void ProcessMessage(RendererMessage message)
        {
            try
            {
                switch (message.Type)
                {
                    case "render":
                        RenderXaml(message.Xaml);
                        break;
                    case "getLayout":
                        GetLayoutMap();
                        break;
                    case "exit":
                        _isRunning = false;
                        Application.Current.Shutdown();
                        break;
                }
            }
            catch (Exception ex)
            {
                SendError(ex.Message);
            }
        }

        private void RenderXaml(string xaml)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine($"[Renderer] Starting render, XAML length: {xaml.Length}");
                
                // Clear previous content
                ContentGrid.Children.Clear();

                // Parse and load XAML
                System.Diagnostics.Debug.WriteLine("[Renderer] Parsing XAML...");
                var xamlObject = XamlReader.Parse(xaml);
                
                if (xamlObject is UIElement element)
                {
                    System.Diagnostics.Debug.WriteLine($"[Renderer] XAML parsed successfully, type: {element.GetType().Name}");
                    
                    ContentGrid.Children.Add(element);
                    
                    // Measure and arrange
                    System.Diagnostics.Debug.WriteLine("[Renderer] Measuring element...");
                    element.Measure(new Size(double.PositiveInfinity, double.PositiveInfinity));
                    element.Arrange(new Rect(0, 0, element.DesiredSize.Width, element.DesiredSize.Height));
                    
                    // Update window size
                    this.Width = Math.Max(element.DesiredSize.Width, 100);
                    this.Height = Math.Max(element.DesiredSize.Height, 100);
                    ContentGrid.Width = this.Width;
                    ContentGrid.Height = this.Height;

                    System.Diagnostics.Debug.WriteLine($"[Renderer] Element size: {this.Width}x{this.Height}");

                    // Force layout update
                    System.Diagnostics.Debug.WriteLine("[Renderer] Updating layout...");
                    this.UpdateLayout();
                    
                    // Wait a bit for rendering to complete
                    System.Threading.Thread.Sleep(100);

                    // Capture as PNG
                    System.Diagnostics.Debug.WriteLine("[Renderer] Capturing to PNG...");
                    var pngBytes = CaptureToPng();
                    System.Diagnostics.Debug.WriteLine($"[Renderer] PNG captured, size: {pngBytes.Length} bytes");
                    
                    // Send response
                    var response = new RendererResponse
                    {
                        Type = "renderComplete",
                        ImageBase64 = Convert.ToBase64String(pngBytes),
                        Width = (int)this.Width,
                        Height = (int)this.Height
                    };
                    
                    System.Diagnostics.Debug.WriteLine("[Renderer] Sending response...");
                    SendResponse(response);
                    System.Diagnostics.Debug.WriteLine("[Renderer] Response sent successfully");
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine($"[Renderer] Error: XAML root is not UIElement, type: {xamlObject?.GetType().Name ?? "null"}");
                    SendError("XAML root must be a UIElement");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Renderer] Exception in RenderXaml: {ex.Message}\n{ex.StackTrace}");
                SendError($"Render error: {ex.Message}");
            }
        }

        private byte[] CaptureToPng()
        {
            var dpiX = 96.0;
            var dpiY = 96.0;
            var width = (int)this.Width;
            var height = (int)this.Height;

            var rtb = new RenderTargetBitmap(width, height, dpiX, dpiY, PixelFormats.Pbgra32);
            rtb.Render(ContentGrid);

            var encoder = new PngBitmapEncoder();
            encoder.Frames.Add(BitmapFrame.Create(rtb));

            using (var ms = new MemoryStream())
            {
                encoder.Save(ms);
                return ms.ToArray();
            }
        }

        private void GetLayoutMap()
        {
            try
            {
                var layoutMap = BuildLayoutMap(ContentGrid);
                var response = new RendererResponse
                {
                    Type = "layoutMap",
                    LayoutMap = layoutMap
                };
                SendResponse(response);
            }
            catch (Exception ex)
            {
                SendError($"Layout error: {ex.Message}");
            }
        }

        private LayoutElement BuildLayoutMap(UIElement element, string parentId = "root")
        {
            var id = Guid.NewGuid().ToString("N").Substring(0, 8);
            var bounds = GetElementBounds(element);
            
            var layoutElement = new LayoutElement
            {
                Id = id,
                Type = element.GetType().Name,
                Name = (element as FrameworkElement)?.Name ?? "",
                Bounds = bounds,
                ParentId = parentId
            };

            if (element is FrameworkElement fe)
            {
                // Get attached properties
                if (fe.Parent is Grid grid)
                {
                    layoutElement.GridRow = Grid.GetRow(fe);
                    layoutElement.GridColumn = Grid.GetColumn(fe);
                }
                else if (fe.Parent is Canvas canvas)
                {
                    layoutElement.CanvasLeft = Canvas.GetLeft(fe);
                    layoutElement.CanvasTop = Canvas.GetTop(fe);
                }

                layoutElement.Margin = fe.Margin.ToString();
                layoutElement.Width = fe.Width;
                layoutElement.Height = fe.Height;
            }

            // Recursively process children
            if (element is Panel panel)
            {
                layoutElement.Children = new System.Collections.Generic.List<LayoutElement>();
                foreach (UIElement child in panel.Children)
                {
                    layoutElement.Children.Add(BuildLayoutMap(child, id));
                }
            }
            else if (element is ContentControl contentControl && contentControl.Content is UIElement contentElement)
            {
                layoutElement.Children = new System.Collections.Generic.List<LayoutElement>
                {
                    BuildLayoutMap(contentElement, id)
                };
            }

            return layoutElement;
        }

        private Bounds GetElementBounds(UIElement element)
        {
            var transform = element.TransformToVisual(ContentGrid);
            var topLeft = transform.Transform(new Point(0, 0));
            var bottomRight = transform.Transform(new Point(
                (element as FrameworkElement)?.ActualWidth ?? 0,
                (element as FrameworkElement)?.ActualHeight ?? 0
            ));

            return new Bounds
            {
                X = (int)topLeft.X,
                Y = (int)topLeft.Y,
                Width = (int)Math.Max(0, bottomRight.X - topLeft.X),
                Height = (int)Math.Max(0, bottomRight.Y - topLeft.Y)
            };
        }

        private void SendResponse(RendererResponse response)
        {
            try
            {
                var json = JsonConvert.SerializeObject(response);
                System.Diagnostics.Debug.WriteLine($"[Renderer] Sending response type: {response.Type}, JSON length: {json.Length}");
                
                // Write to stdout and flush immediately
                Console.Out.WriteLine(json);
                Console.Out.Flush();
                
                // Also try stderr as backup
                Console.Error.WriteLine($"[DEBUG] Response sent: {response.Type}");
                Console.Error.Flush();
                
                System.Diagnostics.Debug.WriteLine($"[Renderer] Response flushed: {response.Type}");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Renderer] Error sending response: {ex.Message}\n{ex.StackTrace}");
                // Try to send error via stderr
                try
                {
                    Console.Error.WriteLine($"{{\"type\":\"error\",\"error\":\"Failed to send response: {ex.Message}\"}}");
                    Console.Error.Flush();
                }
                catch { }
            }
        }

        private void SendError(string error)
        {
            var response = new RendererResponse
            {
                Type = "error",
                Error = error
            };
            SendResponse(response);
        }
    }

    // Message classes
    public class RendererMessage
    {
        [JsonProperty("type")]
        public string Type { get; set; } = "";

        [JsonProperty("xaml")]
        public string Xaml { get; set; } = "";
    }

    public class RendererResponse
    {
        [JsonProperty("type")]
        public string Type { get; set; } = "";

        [JsonProperty("imageBase64")]
        public string ImageBase64 { get; set; } = "";

        [JsonProperty("width")]
        public int Width { get; set; }

        [JsonProperty("height")]
        public int Height { get; set; }

        [JsonProperty("layoutMap")]
        public LayoutElement? LayoutMap { get; set; }

        [JsonProperty("error")]
        public string Error { get; set; } = "";
    }

    public class LayoutElement
    {
        [JsonProperty("id")]
        public string Id { get; set; } = "";

        [JsonProperty("type")]
        public string Type { get; set; } = "";

        [JsonProperty("name")]
        public string Name { get; set; } = "";

        [JsonProperty("bounds")]
        public Bounds? Bounds { get; set; }

        [JsonProperty("parentId")]
        public string ParentId { get; set; } = "";

        [JsonProperty("gridRow")]
        public int GridRow { get; set; } = -1;

        [JsonProperty("gridColumn")]
        public int GridColumn { get; set; } = -1;

        [JsonProperty("canvasLeft")]
        public double CanvasLeft { get; set; } = double.NaN;

        [JsonProperty("canvasTop")]
        public double CanvasTop { get; set; } = double.NaN;

        [JsonProperty("margin")]
        public string Margin { get; set; } = "";

        [JsonProperty("width")]
        public double Width { get; set; } = double.NaN;

        [JsonProperty("height")]
        public double Height { get; set; } = double.NaN;

        [JsonProperty("children")]
        public System.Collections.Generic.List<LayoutElement>? Children { get; set; }
    }

    public class Bounds
    {
        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("width")]
        public int Width { get; set; }

        [JsonProperty("height")]
        public int Height { get; set; }
    }
}

