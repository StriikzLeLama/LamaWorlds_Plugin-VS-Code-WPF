import * as vscode from 'vscode';
import { XamlParser } from '../utils/XamlParser';

/**
 * Accessibility Issue
 */
export interface AccessibilityIssue {
    type: 'error' | 'warning' | 'info';
    element: string;
    elementType: string;
    message: string;
    suggestion: string;
    location: vscode.Location;
}

/**
 * Accessibility Checker - Validates WPF accessibility
 */
export class AccessibilityChecker {
    /**
     * Check XAML document for accessibility issues
     */
    public static async checkAccessibility(document: vscode.TextDocument): Promise<AccessibilityIssue[]> {
        const issues: AccessibilityIssue[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Check for missing AutomationProperties
        const automationPattern = /AutomationProperties\.(Name|HelpText|LabeledBy)=/;
        const elementPattern = /<(\w+)[^>]*>/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const elementMatch = elementPattern.exec(line);

            if (elementMatch) {
                const elementType = elementMatch[1];
                
                // Skip certain elements that don't need automation properties
                const skipTypes = ['Window', 'ResourceDictionary', 'Style', 'ControlTemplate', 'DataTemplate'];
                if (skipTypes.includes(elementType)) {
                    continue;
                }

                // Check for interactive elements
                const interactiveTypes = ['Button', 'TextBox', 'CheckBox', 'RadioButton', 'ComboBox', 'ListBox', 'MenuItem'];
                if (interactiveTypes.includes(elementType)) {
                    if (!automationPattern.test(line)) {
                        issues.push({
                            type: 'warning',
                            element: elementType,
                            elementType,
                            message: `Missing AutomationProperties for ${elementType}`,
                            suggestion: 'Add AutomationProperties.Name or AutomationProperties.HelpText to improve accessibility',
                            location: new vscode.Location(
                                document.uri,
                                new vscode.Position(i, 0)
                            )
                        });
                    }
                }

                // Check for contrast issues (simplified - would need actual color calculation)
                const colorMatch = line.match(/Foreground="([^"]+)"/);
                const bgMatch = line.match(/Background="([^"]+)"/);
                
                if (colorMatch && bgMatch) {
                    // TODO: Calculate actual contrast ratio
                    issues.push({
                        type: 'info',
                        element: elementType,
                        elementType,
                        message: 'Verify color contrast ratio meets WCAG guidelines',
                        suggestion: 'Ensure contrast ratio is at least 4.5:1 for normal text and 3:1 for large text',
                        location: new vscode.Location(
                            document.uri,
                            new vscode.Position(i, 0)
                        )
                    });
                }

                // Check for keyboard navigation
                if (interactiveTypes.includes(elementType)) {
                    const tabIndexMatch = line.match(/TabIndex="([^"]+)"/);
                    if (!tabIndexMatch) {
                        issues.push({
                            type: 'warning',
                            element: elementType,
                            elementType,
                            message: `Tab order not explicitly set for ${elementType}`,
                            suggestion: 'Consider setting TabIndex to ensure logical keyboard navigation order',
                            location: new vscode.Location(
                                document.uri,
                                new vscode.Position(i, 0)
                            )
                        });
                    }
                }
            }
        }

        return issues;
    }

    /**
     * Check for missing focus indicators
     */
    public static async checkFocusIndicators(document: vscode.TextDocument): Promise<AccessibilityIssue[]> {
        const issues: AccessibilityIssue[] = [];
        const text = document.getText();

        // Check if any styles define FocusVisualStyle
        if (!text.includes('FocusVisualStyle')) {
            issues.push({
                type: 'info',
                element: 'Global',
                elementType: 'Style',
                message: 'No FocusVisualStyle found',
                suggestion: 'Consider adding FocusVisualStyle to make keyboard focus visible',
                location: new vscode.Location(document.uri, new vscode.Position(0, 0))
            });
        }

        return issues;
    }
}

