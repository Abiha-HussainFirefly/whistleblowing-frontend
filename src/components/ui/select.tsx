import {
  Children,
  forwardRef,
  isValidElement,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  useMemo,
  useState,
} from 'react';
import {
  SearchableSelect,
  type SearchableSelectGroup,
  type SearchableSelectOption,
} from './searchable-select';
import { cn } from '@lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  searchPlaceholder?: string | undefined;
};

function textFrom(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textFrom).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textFrom(node.props.children);
  }
  return '';
}

function optionFromElement(
  element: ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>,
): SearchableSelectOption {
  const label = textFrom(element.props.children);
  const option: SearchableSelectOption = {
    value: element.props.value !== undefined ? String(element.props.value) : label,
    label,
    keywords: label,
  };
  if (element.props.disabled !== undefined) {
    option.disabled = element.props.disabled;
  }
  return option;
}

function groupsFromChildren(children: ReactNode): SearchableSelectGroup[] {
  const ungrouped: SearchableSelectOption[] = [];
  const groups: SearchableSelectGroup[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (child.type === 'option') {
      ungrouped.push(
        optionFromElement(
          child as ReactElement<{
            value?: string | number;
            children?: ReactNode;
            disabled?: boolean;
          }>,
        ),
      );
      return;
    }

    if (child.type === 'optgroup') {
      const group = child as ReactElement<{ label?: string; children?: ReactNode }>;
      const options: SearchableSelectOption[] = [];
      Children.forEach(group.props.children, (nested) => {
        if (!isValidElement(nested) || nested.type !== 'option') {
          return;
        }
        options.push(
          optionFromElement(
            nested as ReactElement<{
              value?: string | number;
              children?: ReactNode;
              disabled?: boolean;
            }>,
          ),
        );
      });
      groups.push(
        group.props.label !== undefined ? { label: group.props.label, options } : { options },
      );
    }
  });

  return ungrouped.length > 0 ? [{ options: ungrouped }, ...groups] : groups;
}

function nativeSelectClass(className: string | undefined): string {
  return cn(
    'flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-900',
    'focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/25',
    'disabled:cursor-not-allowed disabled:opacity-60',
    className,
  );
}

/**
 * Searchable select with native-select-compatible props. Existing call sites
 * can keep passing <option> children and event-shaped onChange handlers.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      id,
      name,
      required,
      multiple,
      size,
      dir,
      lang,
      translate,
      searchPlaceholder,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const groups = useMemo(() => groupsFromChildren(children), [children]);
    const allOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(
      defaultValue !== undefined ? String(defaultValue) : '',
    );
    const selectedValue = isControlled ? String(value) : internalValue;
    const placeholder = allOptions.find((o) => o.value === '')?.label ?? 'Select...';

    const emitChange = (next: string): void => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.({
        target: { value: next, name },
        currentTarget: { value: next, name },
      } as unknown as ChangeEvent<HTMLSelectElement>);
    };

    if (multiple === true || size !== undefined) {
      return (
        <select
          ref={ref}
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          multiple={multiple}
          size={size}
          dir={dir}
          lang={lang}
          translate={translate}
          aria-label={ariaLabel}
          className={nativeSelectClass(className)}
          {...props}
        >
          {children}
        </select>
      );
    }

    return (
      <>
        <select
          ref={ref}
          id={id !== undefined ? `${id}-native` : undefined}
          name={name}
          required={required}
          disabled={disabled}
          value={selectedValue}
          onChange={onChange}
          onBlur={onBlur}
          dir={dir}
          lang={lang}
          translate={translate}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          {...props}
        >
          {children}
        </select>
        <SearchableSelect
          id={id}
          value={selectedValue}
          onChange={emitChange}
          groups={groups}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          allowEmpty={allOptions.some((o) => o.value === '')}
          disabled={disabled}
          className={className}
          ariaLabel={typeof ariaLabel === 'string' ? ariaLabel : undefined}
          dir={dir}
          lang={lang}
          translate={translate}
        />
      </>
    );
  },
);
Select.displayName = 'Select';
