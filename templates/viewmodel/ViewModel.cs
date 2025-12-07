using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace LamaWorldsApp
{
    public class classname : INotifyPropertyChanged
    {
        public classname()
        {
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}
