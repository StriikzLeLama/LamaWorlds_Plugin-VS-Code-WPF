using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using LamaWorldsApp.Commands;

namespace LamaWorldsApp.ViewModels
{
    public class MainViewModel : INotifyPropertyChanged
    {
        private string _statusMessage = "All Systems Operational";

        public string StatusMessage
        {
            get => _statusMessage;
            set
            {
                _statusMessage = value;
                OnPropertyChanged();
            }
        }

        public ICommand UpdateStatusCommand { get; }

        public MainViewModel()
        {
            UpdateStatusCommand = new RelayCommand(ExecuteUpdateStatus);
        }

        private void ExecuteUpdateStatus(object? obj)
        {
            StatusMessage = "Updated at " + System.DateTime.Now.ToString("HH:mm:ss");
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}
