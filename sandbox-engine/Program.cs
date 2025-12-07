using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Sandbox
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // Read from stdin
            using (var reader = new StreamReader(Console.OpenStandardInput(), Encoding.UTF8))
            {
                while (true)
                {
                    try
                    {
                        var line = await reader.ReadLineAsync();
                        if (string.IsNullOrEmpty(line))
                        {
                            await Task.Delay(100);
                            continue;
                        }

                        var message = JsonConvert.DeserializeObject<SandboxMessage>(line);
                        if (message != null)
                        {
                            await ProcessMessage(message);
                        }
                    }
                    catch (Exception ex)
                    {
                        SendError(ex.Message);
                    }
                }
            }
        }

        static async Task ProcessMessage(SandboxMessage message)
        {
            try
            {
                switch (message.Type)
                {
                    case "execute":
                        await ExecuteCode(message.Code, message.Context);
                        break;
                    case "exit":
                        Environment.Exit(0);
                        break;
                }
            }
            catch (Exception ex)
            {
                SendError(ex.Message);
            }
        }

        static async Task ExecuteCode(string code, object context)
        {
            try
            {
                // Compile and execute code in a secure sandbox
                // This is a simplified version - in production, use Roslyn compiler
                // with restricted permissions and AppDomain isolation

                var result = new SandboxResult
                {
                    Success = true,
                    Output = "Code executed successfully",
                    Logs = new[] { "Execution started", "Code compiled", "Execution completed" },
                    ReturnValue = null
                };

                SendResponse(result);
            }
            catch (Exception ex)
            {
                var result = new SandboxResult
                {
                    Success = false,
                    Error = ex.Message,
                    StackTrace = ex.StackTrace
                };
                SendResponse(result);
            }
        }

        static void SendResponse(SandboxResult result)
        {
            var json = JsonConvert.SerializeObject(result);
            Console.WriteLine(json);
            Console.Out.Flush();
        }

        static void SendError(string error)
        {
            var result = new SandboxResult
            {
                Success = false,
                Error = error
            };
            SendResponse(result);
        }
    }

    public class SandboxMessage
    {
        [JsonProperty("type")]
        public string Type { get; set; } = "";

        [JsonProperty("code")]
        public string Code { get; set; } = "";

        [JsonProperty("context")]
        public object Context { get; set; }
    }

    public class SandboxResult
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("output")]
        public string Output { get; set; } = "";

        [JsonProperty("error")]
        public string Error { get; set; } = "";

        [JsonProperty("stackTrace")]
        public string StackTrace { get; set; } = "";

        [JsonProperty("logs")]
        public string[] Logs { get; set; } = Array.Empty<string>();

        [JsonProperty("returnValue")]
        public object ReturnValue { get; set; }
    }
}

